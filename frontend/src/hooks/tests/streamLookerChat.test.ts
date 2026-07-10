import { describe, it, expect, vi } from 'vitest';
import { streamLookerChat } from '../../utils/streamLookerChat';

// Helper to create a mock ReadableStream that yields string chunks
function createMockStream(chunks: string[]) {
  let index = 0;
  const encoder = new TextEncoder();

  return {
    getReader: () => ({
      read: vi.fn().mockImplementation(async () => {
        if (index < chunks.length) {
          const value = encoder.encode(chunks[index++]);
          return { done: false, value };
        }
        return { done: true, value: undefined };
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn(),
    }),
  };
}

describe('streamLookerChat', () => {
  it('should stream and parse newline-comma delimited JSON chunks correctly', async () => {
    const streamBody = createMockStream([
      '[\n{"id":"chunk1","text":"Hello"}\n,\r\n{"id":"chunk2","text":"World"}\n]',
    ]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: streamBody,
    });
    vi.stubGlobal('fetch', mockFetch);

    const mockSdk = {
      apiPath: '/api/4.0',
      authSession: {
        getToken: vi.fn().mockResolvedValue('test_jwt_token'),
      },
    };

    const messagesReceived: any[] = [];
    const result = await streamLookerChat({
      sdk: mockSdk,
      body: { conversation_id: 'conv_123', user_message: 'test' },
      onMessage: (chunk) => messagesReceived.push(chunk),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/agents\/chat$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_jwt_token',
        }),
      })
    );
    expect(messagesReceived).toHaveLength(2);
    expect(messagesReceived[0]).toEqual({ id: 'chunk1', text: 'Hello' });
    expect(messagesReceived[1]).toEqual({ id: 'chunk2', text: 'World' });
    expect(result).toEqual(messagesReceived);
  });

  it('should buffer and assemble chunks split across multiple reader.read calls', async () => {
    const streamBody = createMockStream([
      '[{"id":"part',
      'ial","data":{"val":42}}]',
    ]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: streamBody,
    }));

    const mockSdk = {
      apiPath: '/api/4.0',
    };

    const messagesReceived: any[] = [];
    const result = await streamLookerChat({
      sdk: mockSdk,
      body: { conversation_id: 'conv_123', user_message: 'split test' },
      onMessage: (chunk) => messagesReceived.push(chunk),
    });

    expect(messagesReceived).toHaveLength(1);
    expect(messagesReceived[0]).toEqual({ id: 'partial', data: { val: 42 } });
    expect(result).toEqual(messagesReceived);
  });

  it('should abort stream reading when abortSignal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    let cancelCalled = false;
    const streamBody = {
      getReader: () => ({
        read: vi.fn().mockImplementation(async () => {
          return { done: false, value: new TextEncoder().encode('{"id":"should_not_parse"}') };
        }),
        cancel: vi.fn().mockImplementation(async () => {
          cancelCalled = true;
        }),
        releaseLock: vi.fn(),
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: streamBody,
    }));

    const mockSdk = {
      apiPath: '/api/4.0',
    };

    const messagesReceived: any[] = [];
    await streamLookerChat({
      sdk: mockSdk,
      body: { conversation_id: 'conv_123', user_message: 'abort test' },
      onMessage: (chunk) => messagesReceived.push(chunk),
      abortSignal: controller.signal,
    });

    expect(cancelCalled).toBe(true);
    expect(messagesReceived).toHaveLength(0);
  });
});
