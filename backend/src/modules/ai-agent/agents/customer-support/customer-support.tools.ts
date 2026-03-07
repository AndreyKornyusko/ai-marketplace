import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { VectorStoreService } from '../../services/vector-store.service';
import { GroundingGuardService } from '../../services/grounding-guard.service';
import { CustomerSupportService } from '../../customer-support.service';

export interface ToolDeps {
  vectorStore: VectorStoreService;
  groundingGuard: GroundingGuardService;
  supportService: CustomerSupportService;
  getConversationId: () => string;
  getUserId: () => string | undefined;
}

export function buildCustomerSupportTools(deps: ToolDeps): DynamicStructuredTool[] {
  return [
    new DynamicStructuredTool({
      name: 'search_catalog',
      description:
        'Search the product catalog using semantic similarity. Use for product recommendations and availability questions.',
      schema: z.object({
        query: z.string().describe('Search query'),
        category: z.string().optional().describe('Optional category filter'),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe('Max results to return'),
      }),
      func: async ({ query, category, maxResults }) => {
        const results = await deps.vectorStore.searchProducts(query, {
          limit: maxResults,
          stockOnly: true,
          category,
        });
        return JSON.stringify(
          results.map((r) => ({
            productId: r.productId,
            content: r.content,
            metadata: r.metadata,
            similarity: r.similarity,
          })),
        );
      },
    }),

    new DynamicStructuredTool({
      name: 'get_product_details',
      description:
        'Get full product details including current price and stock. MUST call this before quoting price or availability.',
      schema: z.object({
        productId: z.string().uuid().describe('Product UUID'),
      }),
      func: async ({ productId }) => {
        const facts = await deps.groundingGuard.validateProductFacts([productId]);
        if (facts.length === 0) {
          return JSON.stringify({ error: 'Product not found' });
        }
        return JSON.stringify(facts[0]);
      },
    }),

    new DynamicStructuredTool({
      name: 'search_policies',
      description:
        'Search store policies and FAQ for relevant information about shipping, returns, payment, etc.',
      schema: z.object({
        query: z.string().describe('Policy question to search for'),
      }),
      func: async ({ query }) => {
        const results = await deps.vectorStore.searchPolicies(query, { limit: 3 });
        return JSON.stringify(
          results.map((r) => ({
            section: r.section,
            topic: r.topic,
            content: r.content,
            similarity: r.similarity,
          })),
        );
      },
    }),

    new DynamicStructuredTool({
      name: 'escalate_to_order_agent',
      description:
        'Hand off to the OrderFulfillmentAgent when the customer has a specific order inquiry.',
      schema: z.object({
        reason: z.string().max(500).describe('Reason for escalation'),
        orderId: z.string().uuid().optional().describe('Order UUID if known'),
      }),
      func: async ({ reason, orderId }) => {
        return JSON.stringify({
          escalated: true,
          agent: 'OrderFulfillmentAgent',
          reason,
          orderId: orderId ?? null,
          message:
            'I am transferring you to our order management team who can assist with your order inquiry.',
        });
      },
    }),

    new DynamicStructuredTool({
      name: 'escalate_to_human',
      description:
        'Escalate to a human support agent for complex issues that cannot be resolved automatically.',
      schema: z.object({
        reason: z.string().max(500).describe('Reason for human escalation'),
        summary: z.string().max(2000).describe('Summary of the conversation context'),
      }),
      func: async ({ reason, summary }) => {
        const conversationId = deps.getConversationId();
        const userId = deps.getUserId();
        await deps.supportService.createEscalationTicket({
          conversationId,
          reason,
          summary,
          userId,
        });
        return JSON.stringify({
          escalated: true,
          agent: 'human',
          message:
            'I have created a support ticket and a human agent will reach out to you shortly.',
        });
      },
    }),
  ];
}
