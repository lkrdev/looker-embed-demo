// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversationalAnalytics } from '../useConversationalAnalytics';

// Mock streamLookerChat so we can control streaming behavior predictably in tests
const mockStreamLookerChat = vi.fn();
vi.mock('../../utils/streamLookerChat', () => ({
  streamLookerChat: (...args: any[]) => mockStreamLookerChat(...args),
}));

// Mock PortalContext
const mockCreateConversation = vi.fn();
const mockAllConversationMessages = vi.fn();
const mockLookerBrowserSdk = {
  ok: vi.fn().mockImplementation((promise) => promise),
  create_conversation: mockCreateConversation,
  all_conversation_messages: mockAllConversationMessages,
  create_conversation_message: vi.fn().mockResolvedValue({}),
  get_conversation: vi.fn(),
};

vi.mock('../../context/PortalContext', () => ({
  usePortal: () => ({
    lookerBrowserSdk: mockLookerBrowserSdk,
    connectionState: 'connected',
    language: 'en',
    brand: 'test_brand',
  }),
}));

describe('useConversationalAnalytics hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamLookerChat.mockReset();
    mockCreateConversation.mockResolvedValue({ id: 'conv_test_default', name: 'Default Conv' });
    mockAllConversationMessages.mockResolvedValue({ messages: [] });
  });

  it('should inject an optimistic user message immediately when sendMessage is called', async () => {
    mockStreamLookerChat.mockImplementation(async ({ onMessage }) => {
      onMessage({
        id: 'agent_chunk_1',
        type: 'system',
        message: {
          systemMessage: {
            text: { textType: 'FINAL_RESPONSE', parts: ['Hello from agent'] },
          },
        },
      });
      return [];
    });

    const { result } = renderHook(() => useConversationalAnalytics());

    await act(async () => {
      await result.current.sendMessage('Hello Agent');
    });

    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
    expect(result.current.messages[0].type).toBe('user');
    expect((result.current.messages[0].message as any).userMessage.text).toContain('Hello Agent');
  });

  it('should automatically bootstrap a new conversation if activeConversationId is null', async () => {
    mockCreateConversation.mockResolvedValue({ id: 'conv_bootstrap_999', name: 'Test Conv' });
    mockStreamLookerChat.mockResolvedValue([]);

    const { result } = renderHook(() => useConversationalAnalytics());

    await act(async () => {
      await result.current.sendMessage('First message');
    });

    expect(mockCreateConversation).toHaveBeenCalledTimes(1);
    expect(result.current.activeConversationId).toBe('conv_bootstrap_999');
  });

  it('should stop active streaming cleanly when stopStreaming is called', async () => {
    mockStreamLookerChat.mockImplementation(async ({ abortSignal }) => {
      return new Promise((resolve) => {
        if (abortSignal?.aborted) {
          resolve([]);
          return;
        }
        abortSignal?.addEventListener('abort', () => resolve([]));
      });
    });

    const { result } = renderHook(() => useConversationalAnalytics());

    let sendPromise: any;
    act(() => {
      sendPromise = result.current.sendMessage('Cancel me');
    });

    // Wait for the streamLookerChat call to have started so abortController is assigned
    await vi.waitFor(() => {
      expect(mockStreamLookerChat).toHaveBeenCalled();
    });

    // Trigger abort
    act(() => {
      result.current.stopStreaming?.();
    });

    await act(async () => {
      await sendPromise;
    });

    expect(result.current.isChatting).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
