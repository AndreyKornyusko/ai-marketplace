# LangChain Patterns — StyleAI Shop

Reference guide for AI agent and RAG pipeline engineers.

## Model Setup

```typescript
import { ChatAnthropic } from '@langchain/anthropic';

const model = new ChatAnthropic({
  model: 'claude-sonnet-4-6',
  temperature: 0,
  maxTokens: 4096,
});
```

## Tool Definition (DynamicStructuredTool)

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const checkStockTool = new DynamicStructuredTool({
  name: 'check_stock',
  description: 'Check current stock levels for one or more products by their IDs.',
  schema: z.object({
    productIds: z.array(z.string().uuid()).describe('Array of product UUIDs to check'),
  }),
  func: async ({ productIds }) => {
    const results = await inventoryService.checkBatch(productIds);
    return JSON.stringify(results);
  },
});
```

## Agent Executor

```typescript
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', systemPromptTemplate],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

const agent = createToolCallingAgent({ llm: model, tools, prompt });

const executor = new AgentExecutor({
  agent,
  tools,
  returnIntermediateSteps: true,
  maxIterations: 10,
  verbose: process.env.NODE_ENV === 'development',
});
```

## Streaming (SSE)

```typescript
// In NestJS controller:
@Sse('stream')
async streamResponse(@Body() dto: AgentQueryDto, @Res() res: Response) {
  const stream = await executor.streamEvents({ input: dto.query }, { version: 'v2' });

  for await (const event of stream) {
    if (event.event === 'on_chat_model_stream') {
      res.write(`data: ${JSON.stringify({ type: 'token', content: event.data.chunk.content })}\n\n`);
    }
    if (event.event === 'on_tool_start') {
      res.write(`data: ${JSON.stringify({ type: 'tool_call', name: event.name, input: event.data.input })}\n\n`);
    }
  }
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
}
```

## RAG Pipeline

```typescript
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { AnthropicEmbeddings } from '@langchain/anthropic';

// Vector store setup
const vectorStore = await PGVectorStore.initialize(
  new AnthropicEmbeddings({ model: 'voyage-3' }),
  {
    postgresConnectionOptions: { connectionString: process.env.DATABASE_URL },
    tableName: 'product_embeddings',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
  }
);

// Retrieval
const retriever = vectorStore.asRetriever({
  k: 5,
  filter: { stock: { $gt: 0 } },  // only in-stock products
});

// In agent RAG tool:
const ragTool = new DynamicStructuredTool({
  name: 'search_catalog',
  description: 'Search the product catalog using semantic similarity.',
  schema: z.object({ query: z.string() }),
  func: async ({ query }) => {
    const docs = await retriever.invoke(query);
    return JSON.stringify(docs.map(d => ({ content: d.pageContent, ...d.metadata })));
  },
});
```

## Chat History Management

```typescript
import { BufferMemory } from 'langchain/memory';
import { RedisChatMessageHistory } from '@langchain/community/stores/message/ioredis';

const memory = new BufferMemory({
  chatHistory: new RedisChatMessageHistory({
    sessionId: conversationId,
    client: redisClient,
    sessionTTL: 3600,
  }),
  returnMessages: true,
  memoryKey: 'chat_history',
});
```

## Context Budget Management

```typescript
const SYSTEM_PROMPT_TOKENS = 500;
const RAG_CONTEXT_BUDGET = 2000;
const RESPONSE_BUDGET = 1024;
const MAX_HISTORY_TOKENS = 4096 - SYSTEM_PROMPT_TOKENS - RAG_CONTEXT_BUDGET - RESPONSE_BUDGET;

// Trim history if over budget
async function trimHistory(history: BaseMessage[]): Promise<BaseMessage[]> {
  // Keep last N messages that fit within MAX_HISTORY_TOKENS
  // ...
}
```
