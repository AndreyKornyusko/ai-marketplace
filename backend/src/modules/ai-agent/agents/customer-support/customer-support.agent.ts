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
  ) {}

  private buildExecutor(options: SupportInvokeOptions): AgentExecutor {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-6',
      temperature: 0,
      maxTokens: 4096,
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
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

  // Langfuse tracing — install langfuse-langchain to enable AC 8
  private buildLangfuseCallback(_options: SupportInvokeOptions): object | null {
    const secretKey = this.configService.get<string>('LANGFUSE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('LANGFUSE_SECRET_KEY not set — Langfuse tracing disabled');
      return null;
    }
    // TODO: install langfuse-langchain, then replace this stub with:
    // import { CallbackHandler } from 'langfuse-langchain';
    // const userId = _options.userId ?? `anonymous_${_options.conversationId}`;
    // return new CallbackHandler({
    //   publicKey: this.configService.getOrThrow<string>('LANGFUSE_PUBLIC_KEY'),
    //   secretKey,
    //   baseUrl: this.configService.get<string>('LANGFUSE_HOST') ?? 'https://cloud.langfuse.com',
    //   userId,
    //   sessionId: _options.conversationId,
    //   tags: ['customer-support', 'agent', 'rag'],
    //   flushAt: 1,
    // });
    this.logger.warn('langfuse-langchain not installed — add it to package.json to enable tracing');
    return null;
  }

  async invoke(options: SupportInvokeOptions): Promise<SupportInvokeResult> {
    const executor = this.buildExecutor(options);
    const langfuseHandler = this.buildLangfuseCallback(options);
    const callbacks = [langfuseHandler].filter((cb): cb is object => cb !== null);

    const result = await executor.invoke(
      { input: options.message, chat_history: options.chatHistory ?? [] },
      { callbacks },
    );

    return {
      conversationId: options.conversationId,
      reply: typeof result.output === 'string' ? result.output : String(result.output ?? ''),
      intermediateSteps: Array.isArray(result.intermediateSteps)
        ? (result.intermediateSteps as AgentStep[])
        : [],
    };
  }

  getStreamEvents(options: SupportInvokeOptions): AsyncIterable<StreamEvent> {
    const executor = this.buildExecutor(options);
    const langfuseHandler = this.buildLangfuseCallback(options);
    const callbacks = [langfuseHandler].filter((cb): cb is object => cb !== null);

    return executor.streamEvents(
      { input: options.message, chat_history: options.chatHistory ?? [] },
      { version: 'v2', callbacks },
    ) as AsyncIterable<StreamEvent>;
  }
}
