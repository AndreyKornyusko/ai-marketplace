import { buildCustomerSupportTools, ToolDeps } from './customer-support.tools';
import { VectorStoreService, ProductSearchResult, PolicySearchResult } from '../../services/vector-store.service';
import { GroundingGuardService, GroundedProductFact } from '../../services/grounding-guard.service';
import { CustomerSupportService } from '../../customer-support.service';

// ---------------------------------------------------------------------------
// Mock factory helpers
// ---------------------------------------------------------------------------

function buildMockVectorStore(): jest.Mocked<Pick<VectorStoreService, 'searchProducts' | 'searchPolicies'>> {
  return {
    searchProducts: jest.fn(),
    searchPolicies: jest.fn(),
  };
}

function buildMockGroundingGuard(): jest.Mocked<Pick<GroundingGuardService, 'validateProductFacts'>> {
  return {
    validateProductFacts: jest.fn(),
  };
}

function buildMockSupportService(): jest.Mocked<Pick<CustomerSupportService, 'createEscalationTicket'>> {
  return {
    createEscalationTicket: jest.fn(),
  };
}

function makeProductSearchResult(overrides: Partial<ProductSearchResult> = {}): ProductSearchResult {
  return {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    content: 'Blue cotton shirt, size M',
    metadata: { category: 'shirts', hasStock: true },
    similarity: 0.92,
    ...overrides,
  };
}

function makePolicySearchResult(overrides: Partial<PolicySearchResult> = {}): PolicySearchResult {
  return {
    id: 'policy-uuid-1',
    section: 'shipping',
    topic: 'free shipping',
    content: 'Free shipping on orders over $50.',
    metadata: {},
    similarity: 0.95,
    ...overrides,
  };
}

function makeGroundedFact(overrides: Partial<GroundedProductFact> = {}): GroundedProductFact {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Blue Shirt',
    price: 29.99,
    stock: 10,
    isAvailable: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shared test deps builder
// ---------------------------------------------------------------------------

function buildDeps(
  overrides: Partial<{
    vectorStore: ToolDeps['vectorStore'];
    groundingGuard: ToolDeps['groundingGuard'];
    supportService: ToolDeps['supportService'];
    getConversationId: ToolDeps['getConversationId'];
    getUserId: ToolDeps['getUserId'];
  }> = {},
): {
  deps: ToolDeps;
  vectorStore: ReturnType<typeof buildMockVectorStore>;
  groundingGuard: ReturnType<typeof buildMockGroundingGuard>;
  supportService: ReturnType<typeof buildMockSupportService>;
} {
  const vectorStore = buildMockVectorStore();
  const groundingGuard = buildMockGroundingGuard();
  const supportService = buildMockSupportService();

  const deps: ToolDeps = {
    vectorStore: (overrides.vectorStore ?? vectorStore) as VectorStoreService,
    groundingGuard: (overrides.groundingGuard ?? groundingGuard) as GroundingGuardService,
    supportService: (overrides.supportService ?? supportService) as CustomerSupportService,
    getConversationId: overrides.getConversationId ?? (() => 'conv-test-123'),
    getUserId: overrides.getUserId ?? (() => undefined),
  };

  return { deps, vectorStore, groundingGuard, supportService };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildCustomerSupportTools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns exactly 5 tools with the expected names', () => {
    const { deps } = buildDeps();
    const tools = buildCustomerSupportTools(deps);
    const names = tools.map((t) => t.name);

    expect(tools).toHaveLength(5);
    expect(names).toContain('search_catalog');
    expect(names).toContain('get_product_details');
    expect(names).toContain('search_policies');
    expect(names).toContain('escalate_to_human');
    expect(names).toContain('escalate_to_order_agent');
  });

  // -------------------------------------------------------------------------
  // search_catalog
  // -------------------------------------------------------------------------

  describe('search_catalog', () => {
    it('calls searchProducts with correct options and returns serialised result array', async () => {
      const { deps, vectorStore } = buildDeps();
      const mockResult = makeProductSearchResult();
      vectorStore.searchProducts.mockResolvedValue([mockResult]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_catalog')!;
      const raw = await tool.invoke({ query: 'blue shirt', maxResults: 5 });

      expect(vectorStore.searchProducts).toHaveBeenCalledWith('blue shirt', {
        limit: 5,
        stockOnly: true,
        category: undefined,
      });

      const parsed: ProductSearchResult[] = JSON.parse(raw) as ProductSearchResult[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({
        productId: mockResult.productId,
        content: mockResult.content,
        metadata: mockResult.metadata,
        similarity: mockResult.similarity,
      });
    });

    it('forwards the optional category filter to searchProducts', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchProducts.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_catalog')!;
      await tool.invoke({ query: 'hoodie', category: 'tops', maxResults: 3 });

      expect(vectorStore.searchProducts).toHaveBeenCalledWith('hoodie', {
        limit: 3,
        stockOnly: true,
        category: 'tops',
      });
    });

    it('returns an empty array when searchProducts returns no results', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchProducts.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_catalog')!;
      const raw = await tool.invoke({ query: 'invisible product', maxResults: 5 });

      expect(JSON.parse(raw)).toEqual([]);
    });

    it('returns multiple results preserving order', async () => {
      const { deps, vectorStore } = buildDeps();
      const first = makeProductSearchResult({ similarity: 0.98, content: 'Red Dress' });
      const second = makeProductSearchResult({
        productId: '223e4567-e89b-12d3-a456-426614174001',
        similarity: 0.85,
        content: 'Pink Skirt',
      });
      vectorStore.searchProducts.mockResolvedValue([first, second]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_catalog')!;
      const parsed: Array<{ content: string }> = JSON.parse(await tool.invoke({ query: 'dress', maxResults: 2 })) as Array<{ content: string }>;

      expect(parsed[0].content).toBe('Red Dress');
      expect(parsed[1].content).toBe('Pink Skirt');
    });

    it('always passes stockOnly:true regardless of query', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchProducts.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_catalog')!;
      await tool.invoke({ query: 'anything', maxResults: 1 });

      expect(vectorStore.searchProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ stockOnly: true }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // get_product_details
  // -------------------------------------------------------------------------

  describe('get_product_details', () => {
    const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

    it('returns grounded product facts for a valid UUID', async () => {
      const { deps, groundingGuard } = buildDeps();
      const fact = makeGroundedFact();
      groundingGuard.validateProductFacts.mockResolvedValue([fact]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'get_product_details')!;
      const raw = await tool.invoke({ productId: VALID_UUID });

      expect(groundingGuard.validateProductFacts).toHaveBeenCalledWith([VALID_UUID]);
      expect(JSON.parse(raw)).toEqual(fact);
    });

    it('returns { error: "Product not found" } when validateProductFacts returns empty array', async () => {
      const { deps, groundingGuard } = buildDeps();
      groundingGuard.validateProductFacts.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'get_product_details')!;
      const raw = await tool.invoke({ productId: VALID_UUID });

      expect(JSON.parse(raw)).toEqual({ error: 'Product not found' });
    });

    it('returns only the first fact when validateProductFacts returns multiple', async () => {
      const { deps, groundingGuard } = buildDeps();
      const first = makeGroundedFact({ id: VALID_UUID, name: 'First Product' });
      const second = makeGroundedFact({
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Second Product',
      });
      groundingGuard.validateProductFacts.mockResolvedValue([first, second]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'get_product_details')!;
      const parsed: GroundedProductFact = JSON.parse(await tool.invoke({ productId: VALID_UUID })) as GroundedProductFact;

      expect(parsed.name).toBe('First Product');
    });

    it('exposes the correct price as a number (grounding guarantee)', async () => {
      const { deps, groundingGuard } = buildDeps();
      groundingGuard.validateProductFacts.mockResolvedValue([makeGroundedFact({ price: 49.95 })]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'get_product_details')!;
      const parsed: GroundedProductFact = JSON.parse(await tool.invoke({ productId: VALID_UUID })) as GroundedProductFact;

      expect(parsed.price).toBe(49.95);
      expect(typeof parsed.price).toBe('number');
    });

    it('exposes isAvailable=false for an out-of-stock product', async () => {
      const { deps, groundingGuard } = buildDeps();
      groundingGuard.validateProductFacts.mockResolvedValue([
        makeGroundedFact({ stock: 0, isAvailable: false }),
      ]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'get_product_details')!;
      const parsed: GroundedProductFact = JSON.parse(await tool.invoke({ productId: VALID_UUID })) as GroundedProductFact;

      expect(parsed.isAvailable).toBe(false);
      expect(parsed.stock).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // search_policies
  // -------------------------------------------------------------------------

  describe('search_policies', () => {
    it('calls searchPolicies with limit 3 and returns mapped result', async () => {
      const { deps, vectorStore } = buildDeps();
      const mockPolicy = makePolicySearchResult();
      vectorStore.searchPolicies.mockResolvedValue([mockPolicy]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_policies')!;
      const raw = await tool.invoke({ query: 'free shipping' });

      expect(vectorStore.searchPolicies).toHaveBeenCalledWith('free shipping', { limit: 3 });

      const parsed: Array<{ section: string; topic: string; content: string; similarity: number }> =
        JSON.parse(raw) as Array<{ section: string; topic: string; content: string; similarity: number }>;

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        section: 'shipping',
        topic: 'free shipping',
        content: 'Free shipping on orders over $50.',
        similarity: 0.95,
      });
    });

    it('does not expose the raw id field from PolicySearchResult', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchPolicies.mockResolvedValue([makePolicySearchResult({ id: 'should-not-appear' })]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_policies')!;
      const raw = await tool.invoke({ query: 'returns' });

      const parsed: Record<string, unknown>[] = JSON.parse(raw) as Record<string, unknown>[];
      expect(parsed[0]).not.toHaveProperty('id');
    });

    it('returns an empty array when no policies match', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchPolicies.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_policies')!;
      const raw = await tool.invoke({ query: 'unknown query' });

      expect(JSON.parse(raw)).toEqual([]);
    });

    it('always hardcodes limit 3 — ignores any additional caller options', async () => {
      const { deps, vectorStore } = buildDeps();
      vectorStore.searchPolicies.mockResolvedValue([]);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'search_policies')!;
      await tool.invoke({ query: 'warranty' });

      expect(vectorStore.searchPolicies).toHaveBeenCalledWith('warranty', { limit: 3 });
    });
  });

  // -------------------------------------------------------------------------
  // escalate_to_human
  // -------------------------------------------------------------------------

  describe('escalate_to_human', () => {
    it('creates an escalation ticket with correct params and returns escalated=true', async () => {
      const { deps, supportService } = buildDeps({
        getConversationId: () => 'conv-abc',
        getUserId: () => undefined,
      });
      supportService.createEscalationTicket.mockResolvedValue(undefined);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_human')!;
      const raw = await tool.invoke({ reason: 'Billing dispute', summary: 'Customer charged twice' });

      expect(supportService.createEscalationTicket).toHaveBeenCalledWith({
        conversationId: 'conv-abc',
        reason: 'Billing dispute',
        summary: 'Customer charged twice',
        userId: undefined,
      });

      const parsed: { escalated: boolean; agent: string } =
        JSON.parse(raw) as { escalated: boolean; agent: string };
      expect(parsed.escalated).toBe(true);
      expect(parsed.agent).toBe('human');
    });

    it('forwards the userId from getUserId() when a user is authenticated', async () => {
      const { deps, supportService } = buildDeps({
        getConversationId: () => 'conv-xyz',
        getUserId: () => 'user-999',
      });
      supportService.createEscalationTicket.mockResolvedValue(undefined);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_human')!;
      await tool.invoke({ reason: 'Fraud concern', summary: 'Unauthorised order placed' });

      expect(supportService.createEscalationTicket).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-999', conversationId: 'conv-xyz' }),
      );
    });

    it('uses the conversationId from getConversationId() closure each invocation', async () => {
      let counter = 0;
      const { deps, supportService } = buildDeps({
        getConversationId: () => {
          counter += 1;
          return `conv-${counter}`;
        },
      });
      supportService.createEscalationTicket.mockResolvedValue(undefined);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_human')!;
      await tool.invoke({ reason: 'Issue 1', summary: 'First call' });
      await tool.invoke({ reason: 'Issue 2', summary: 'Second call' });

      const calls = supportService.createEscalationTicket.mock.calls;
      expect(calls[0][0].conversationId).toBe('conv-1');
      expect(calls[1][0].conversationId).toBe('conv-2');
    });

    it('includes a human-readable message in the response', async () => {
      const { deps, supportService } = buildDeps();
      supportService.createEscalationTicket.mockResolvedValue(undefined);

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_human')!;
      const raw = await tool.invoke({ reason: 'Complex issue', summary: 'Details here' });

      const parsed: { message: string } = JSON.parse(raw) as { message: string };
      expect(typeof parsed.message).toBe('string');
      expect(parsed.message.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // escalate_to_order_agent
  // -------------------------------------------------------------------------

  describe('escalate_to_order_agent', () => {
    const ORDER_UUID = '223e4567-e89b-12d3-a456-426614174001';

    it('returns escalated=true with agent=OrderFulfillmentAgent', async () => {
      const { deps } = buildDeps();

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_order_agent')!;
      const raw = await tool.invoke({ reason: 'Order not delivered', orderId: ORDER_UUID });

      const parsed: { escalated: boolean; agent: string; reason: string; orderId: string | null } =
        JSON.parse(raw) as { escalated: boolean; agent: string; reason: string; orderId: string | null };

      expect(parsed.escalated).toBe(true);
      expect(parsed.agent).toBe('OrderFulfillmentAgent');
    });

    it('echoes the reason in the response', async () => {
      const { deps } = buildDeps();

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_order_agent')!;
      const raw = await tool.invoke({ reason: 'Package missing', orderId: ORDER_UUID });

      const parsed: { reason: string } = JSON.parse(raw) as { reason: string };
      expect(parsed.reason).toBe('Package missing');
    });

    it('echoes the orderId when provided', async () => {
      const { deps } = buildDeps();

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_order_agent')!;
      const raw = await tool.invoke({ reason: 'Wrong item', orderId: ORDER_UUID });

      const parsed: { orderId: string | null } = JSON.parse(raw) as { orderId: string | null };
      expect(parsed.orderId).toBe(ORDER_UUID);
    });

    it('sets orderId to null when no orderId is provided', async () => {
      const { deps } = buildDeps();

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_order_agent')!;
      const raw = await tool.invoke({ reason: 'General order question' });

      const parsed: { orderId: string | null } = JSON.parse(raw) as { orderId: string | null };
      expect(parsed.orderId).toBeNull();
    });

    it('does not call any external service — pure data response', async () => {
      const { deps, vectorStore, groundingGuard, supportService } = buildDeps();

      const tool = buildCustomerSupportTools(deps).find((t) => t.name === 'escalate_to_order_agent')!;
      await tool.invoke({ reason: 'Status check', orderId: ORDER_UUID });

      expect(vectorStore.searchProducts).not.toHaveBeenCalled();
      expect(vectorStore.searchPolicies).not.toHaveBeenCalled();
      expect(groundingGuard.validateProductFacts).not.toHaveBeenCalled();
      expect(supportService.createEscalationTicket).not.toHaveBeenCalled();
    });
  });
});
