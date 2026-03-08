'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SupportMessage } from '@/components/support/SupportMessage';
import { ProductCardInline } from '@/components/support/ProductCardInline';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface SupportApiResponse {
  conversationId: string;
  reply: string;
}

// Attempt to extract a JSON product array embedded in agent reply text.
// The agent may embed a block like: ```json\n[{...}]\n``` or plain JSON array.
interface InlineProduct {
  id: string;
  name: string;
  price: number;
  slug?: string;
  inStock?: boolean;
}

function parseInlineProducts(content: string): InlineProduct[] {
  const fencedMatch = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/.exec(content);
  const rawMatch = fencedMatch ? fencedMatch[1] : /(\[[\s\S]*?\])/.exec(content)?.[1];
  if (!rawMatch) return [];
  try {
    const parsed: unknown = JSON.parse(rawMatch);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is InlineProduct =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>)['id'] === 'string' &&
        typeof (item as Record<string, unknown>)['name'] === 'string' &&
        typeof (item as Record<string, unknown>)['price'] === 'number',
    );
  } catch {
    return [];
  }
}

// Strip the JSON block from content so we don't show raw JSON in the bubble.
function stripJsonBlock(content: string): string {
  return content.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/, '').trim();
}

function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function SupportChat(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'agent',
      content:
        "Hi! I'm your StyleAI support assistant. I can help you find products, answer questions about shipping and returns, or assist with any other inquiries. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? '';
      const response = await fetch(
        `${apiBase}/api/v1/ai/customer-support`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: messageText, conversationId }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = (await response.json()) as SupportApiResponse;
      setConversationId(data.conversationId);

      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content:
          'Sorry, I\'m having trouble connecting right now. Please try again or use the "Talk to a human" button.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTalkToHuman = (): void => {
    void sendMessage('I would like to speak with a human support agent.');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl shadow-sm bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium text-gray-900">StyleAI Support</span>
        </div>
        <button
          type="button"
          onClick={handleTalkToHuman}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Talk to a human
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const inlineProducts = msg.role === 'agent' ? parseInlineProducts(msg.content) : [];
          const displayContent =
            inlineProducts.length > 0 ? stripJsonBlock(msg.content) : msg.content;

          return (
            <div key={msg.id}>
              <SupportMessage message={{ ...msg, content: displayContent }} />
              {inlineProducts.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 pl-2">
                  {inlineProducts.map((product) => (
                    <ProductCardInline key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="support-chat-input" className="sr-only">
            Type your message
          </label>
          <input
            id="support-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, shipping, returns..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
