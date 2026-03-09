import { Injectable, Logger } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, AgentStep, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ConfigService } from '@nestjs/config';
import { BaseMessage } from '@langchain/core/messages';
import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import { VectorStoreService } from '../../services/vector-store.service';
import { GroundingGuardService } from '../../services/grounding-guard.service';
import { CustomerSupportService } from '../../customer-support.service';
import { LangfuseService } from '../../langfuse.service';
import { buildCustomerSupportTools } from './customer-support.tools';
import { CUSTOMER_SUPPORT_SYSTEM_PROMPT } from './customer-support.prompt';

export interface SupportInvokeOptions {
  message: string;
  conversationId: string;
  userId?: string;
  chatHistory?: BaseMessage[];
}

export interface SupportInvokeResult {
  conversationId: string;
  reply: string;
  intermediateSteps?: AgentStep[];
}

@Injectable()
export class CustomerSupportAgent {
  private readonly logger = new Logger(CustomerSupportAgent.name);

  constructor(
    private readonly vectorStore: VectorStoreService,
    private readonly groundingGuard: GroundingGuardService,
    private readonly supportService: CustomerSupportService,
    private readonly configService: ConfigService,
    private readonly langfuse: LangfuseService,
  ) {}

  private buildExecutor(options: SupportInvokeOptions): AgentExecutor {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-6',
      temperature: 0,
      maxTokens: 4096,
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
      // @langchain/anthropic@0.3.x always sends top_p:-1 as a sentinel, but
      // claude-sonnet-4-6 rejects both temperature+top_p being set simultaneously.
      // invocationKwargs spreads last, so `top_p: undefined` strips it from the request.
      invocationKwargs: { top_p: undefined },
    });

    const tools = buildCustomerSupportTools({
      vectorStore: this.vectorStore,
      groundingGuard: this.groundingGuard,
      supportService: this.supportService,
      getConversationId: () => options.conversationId,
      getUserId: () => options.userId,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', CUSTOMER_SUPPORT_SYSTEM_PROMPT],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = createToolCallingAgent({ llm: model, tools, prompt });

    return new AgentExecutor({
      agent,
      tools,
      returnIntermediateSteps: true,
      maxIterations: 10,
    });
  }

  private extractText(output: unknown): string {
    if (typeof output === 'string') return output;
    // Claude tool-calling agents return content blocks: [{type:'text', text:'...'}]
    if (Array.isArray(output)) {
      return output
        .filter((block): block is { type: string; text: string } => block?.type === 'text')
        .map((block) => block.text)
        .join('');
    }
    if (output && typeof output === 'object' && 'text' in output) {
      return String((output as { text: unknown }).text);
    }
    return String(output ?? '');
  }

  private countGroundingFailures(steps: AgentStep[]): number {
    let count = 0;
    for (const step of steps) {
      const observation = step.observation;
      if (typeof observation === 'string' && observation.toLowerCase().includes('grounding')) {
        count++;
      }
      const toolInput = step.action?.toolInput;
      if (
        toolInput &&
        typeof toolInput === 'object' &&
        'error' in toolInput &&
        String((toolInput as Record<string, unknown>).error)
          .toLowerCase()
          .includes('grounding')
      ) {
        count++;
      }
    }
    return count;
  }

  async invoke(options: SupportInvokeOptions): Promise<SupportInvokeResult> {
    const userId = options.userId ?? `anonymous_${options.conversationId}`;
    const trace = this.langfuse.createTrace({
      name: 'customer-support-agent',
      userId,
      sessionId: options.conversationId,
      metadata: { messageCount: options.chatHistory?.length ?? 0 },
      tags: ['customer-support', 'agent', 'rag'],
    });

    const executor = this.buildExecutor(options);

    const span = trace.span({ name: 'agent-execution', input: { message: options.message }, startTime: new Date() });

    let result: Awaited<ReturnType<typeof executor.invoke>>;
    try {
      result = await executor.invoke(
        { input: options.message, chat_history: options.chatHistory ?? [] },
      );
    } catch (err) {
      span.end({ output: { error: String(err) } });
      throw err;
    }

    const intermediateSteps = Array.isArray(result.intermediateSteps)
      ? (result.intermediateSteps as AgentStep[])
      : [];

    const groundingFailures = this.countGroundingFailures(intermediateSteps);
    if (groundingFailures > 0) {
      trace.event({
        name: 'grounding_failure',
        input: { count: groundingFailures },
      });
      this.logger.warn('AI agent grounding check failed', {
        agentType: 'CustomerSupportAgent',
        userId,
        count: groundingFailures,
      });
    }

    const reply = this.extractText(result.output);
    span.end({ output: { reply } });

    // Detect escalation by checking if escalation ticket was created (tool name in steps)
    const wasEscalated = intermediateSteps.some(
      (s) => s.action?.tool === 'escalate_to_human_support',
    );

    if (wasEscalated) {
      this.logger.log('AI agent escalation triggered', {
        agentType: 'CustomerSupportAgent',
        userId,
        reason: 'escalate_to_human_support tool called',
      });
    }

    trace.score({ name: 'escalated', value: wasEscalated ? 1 : 0 });
    trace.score({ name: 'grounding_failures', value: groundingFailures });

    return {
      conversationId: options.conversationId,
      reply,
      intermediateSteps,
    };
  }

  getStreamEvents(options: SupportInvokeOptions): AsyncIterable<StreamEvent> {
    const executor = this.buildExecutor(options);

    return executor.streamEvents(
      { input: options.message, chat_history: options.chatHistory ?? [] },
      { version: 'v2' },
    ) as AsyncIterable<StreamEvent>;
  }
}
