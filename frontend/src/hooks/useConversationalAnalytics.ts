import { useState, useEffect, useCallback, useRef } from 'react';
import { usePortal } from '../context/PortalContext';
import { CHAT_AGENT_ID } from '../config/constants';
import { streamLookerChat } from '../utils/streamLookerChat';
import type { UseConversationalAnalyticsReturn, ConversationalMessageItem, CachedConversationsStorage } from '../types';

const getStorageKey = (brand?: string | null) => `looker_ca_cached_conversations_${brand || 'default'}`;

class AsyncQueue<T> {
  private queue: T[] = [];
  private resolvers: Array<(result: { value?: T; done: boolean }) => void> = [];
  private closed = false;
  private err: any = null;

  enqueue(item: T) {
    if (this.closed || this.err) return;
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ value: item, done: false });
    } else {
      this.queue.push(item);
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ done: true });
    }
  }

  error(err: any) {
    if (this.closed || this.err) return;
    this.err = err;
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ done: true });
    }
  }

  async dequeue(): Promise<{ value?: T; done: boolean }> {
    if (this.err) {
      throw this.err;
    }
    if (this.queue.length > 0) {
      return { value: this.queue.shift()!, done: false };
    }
    if (this.closed) {
      return { done: true };
    }
    return new Promise<{ value?: T; done: boolean }>((resolve) => {
      this.resolvers.push(resolve);
    });
  }
}

export function useConversationalAnalytics(options?: { staggerDelay?: number }): UseConversationalAnalyticsReturn {
  const { lookerBrowserSdk, connectionState, language, brand } = usePortal();
  const staggerDelay = options?.staggerDelay ?? 400;

  // Local storage cache helper
  const getStorageCache = useCallback((): CachedConversationsStorage => {
    try {
      const raw = localStorage.getItem(getStorageKey(brand));
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          activeId: parsed.activeId || null,
          cachedIds: Array.isArray(parsed.cachedIds) ? parsed.cachedIds : [],
        };
      }
    } catch (e) {
      console.warn('Error reading cached conversations from localStorage:', e);
    }
    return { activeId: null, cachedIds: [] };
  }, [brand]);

  const updateStorageCache = useCallback((activeId: string | null, newIdToAdd?: string) => {
    try {
      const current = getStorageCache();
      const idSet = new Set(current.cachedIds);
      if (newIdToAdd) idSet.add(newIdToAdd);
      if (activeId) idSet.add(activeId);
      
      const updated: CachedConversationsStorage = {
        activeId,
        cachedIds: Array.from(idSet),
      };
      localStorage.setItem(getStorageKey(brand), JSON.stringify(updated));
    } catch (e) {
      console.warn('Error updating localStorage cache:', e);
    }
  }, [getStorageCache, brand]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return getStorageCache().activeId;
  });
  const [messages, setMessages] = useState<ConversationalMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [visualization, setVisualization] = useState<any | null>(null);
  const latestVegaRef = useRef<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const incomingQueueRef = useRef<ConversationalMessageItem[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const networkStreamActiveRef = useRef<boolean>(false);
  const messagesRef = useRef<ConversationalMessageItem[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);



  // Robust extraction helper for Vega-Lite visualization object
  const extractVegaConfig = (msg: any): any | null => {
    if (!msg) return null;
    const sys = msg.message?.systemMessage || (msg as any).systemMessage || msg;
    const chart = sys?.chart || (msg as any).chart;
    if (!chart) return null;
    return chart.result?.vegaConfig || chart.vegaConfig || chart;
  };

  // Helper to process message flow: saves vegalite viz to state, enriches loading state intermediary message, and prepends viz to final text output
  const processMessageFlow = useCallback((msgs: ConversationalMessageItem[]): ConversationalMessageItem[] => {
    if (!Array.isArray(msgs) || msgs.length === 0) {
      latestVegaRef.current = null;
      return msgs;
    }

    const processed = msgs.map(m => {
      const copy = { ...m };
      if (copy.message) {
        copy.message = { ...copy.message };
        if (copy.message.systemMessage) {
          copy.message.systemMessage = { ...copy.message.systemMessage };
        }
      }
      if ((copy as any).systemMessage) {
        (copy as any).systemMessage = { ...(copy as any).systemMessage };
      }
      return copy;
    });

    let currentTurnVega: any | null = null;
    let turnStartIndex = 0;

    for (let i = 0; i < processed.length; i++) {
      const msg = processed[i];
      const type = msg.type || (msg.message?.userMessage || (msg as any).userMessage ? 'user' : 'system');

      if (type === 'user') {
        turnStartIndex = i;
        currentTurnVega = null;
      } else {
        const vega = extractVegaConfig(msg);
        if (vega) {
          currentTurnVega = vega;
          latestVegaRef.current = vega;

          // In the loading state itself just provide a helpful message around "the visualization is being generated, etc."
          const sys = msg.message?.systemMessage || (msg as any).systemMessage || msg;
          if (sys) {
            const hasText = sys.text && (
              (typeof sys.text === 'string' && sys.text.trim().length > 0) ||
              (Array.isArray(sys.text.parts) && sys.text.parts.join('').trim().length > 0) ||
              (typeof sys.text?.parts === 'string' && sys.text.parts.trim().length > 0)
            );
            if (!hasText) {
              sys.text = {
                textType: 'INTERMEDIARY',
                parts: ['The visualization is being generated...']
              };
            }
          }
        }
      }

      // Check if this turn has a final text output message and prepend the saved vega config to it outside the loading state
      const isTurnEnd = i === processed.length - 1 || (i + 1 < processed.length && (processed[i + 1].type === 'user' || processed[i + 1].message?.userMessage || (processed[i + 1] as any).userMessage));
      if (isTurnEnd && currentTurnVega) {
        let finalMsgIdx = -1;
        for (let j = i; j >= turnStartIndex; j--) {
          const m = processed[j];
          const sys = m.message?.systemMessage || (m as any).systemMessage || m;
          const textType = (sys?.text?.textType || sys?.textType || '').toUpperCase();
          const isExplicitFinal = textType === 'FINAL_RESPONSE';
          const isKnownIntermediary =
            textType === 'THOUGHT' ||
            textType === 'INTERMEDIARY' ||
            textType === 'PROGRESS';
          if (
            isExplicitFinal ||
            (j === i && sys?.text && !isKnownIntermediary && !sys?.chart && !sys?.vegaConfig)
          ) {
            finalMsgIdx = j;
            break;
          }
        }

        if (finalMsgIdx !== -1) {
          const finalMsg = processed[finalMsgIdx];
          const sys = finalMsg.message?.systemMessage || (finalMsg as any).systemMessage || finalMsg;
          if (sys) {
            sys.chart = { result: { vegaConfig: currentTurnVega } };
            sys.vegaConfig = currentTurnVega;
          }
          (finalMsg as any).chart = { result: { vegaConfig: currentTurnVega } };
          (finalMsg as any).vegaConfig = currentTurnVega;
        }
      }
    }

    return processed;
  }, []);

  const processNextQueueItem = useCallback(() => {
    if (incomingQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      if (!networkStreamActiveRef.current) {
        setIsChatting(false);
      }
      return;
    }

    const block = incomingQueueRef.current.shift()!;
    setMessages(prev => {
      const isExisting = prev.some(m => (m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId));
      let updated: ConversationalMessageItem[];
      if (isExisting) {
        updated = prev.map(m => ((m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId)) ? { ...m, ...block } : m);
      } else {
        updated = [...prev, block];
      }
      return processMessageFlow(updated);
    });

    if (staggerDelay > 0) {
      setTimeout(() => {
        processNextQueueItem();
      }, staggerDelay);
    } else {
      processNextQueueItem();
    }
  }, [processMessageFlow, staggerDelay]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsChatting(false);
    }
  }, []);

  useEffect(() => {
    if (latestVegaRef.current !== visualization) {
      setVisualization(latestVegaRef.current);
    }
  }, [messages, visualization]);

  // Robust extraction helper per KI guidelines
  const extractCollection = (res: any, key: string): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (typeof res === 'object') {
      return res[key] || res.results || res.items || res.messages || res.conversations || [];
    }
    return [];
  };

  // 1. Fetch available conversations
  const refreshConversations = useCallback(async () => {
    if (!lookerBrowserSdk || connectionState !== 'connected') return;
    try {
      const { cachedIds, activeId } = getStorageCache();
      const idsToFetch = Array.from(new Set([...cachedIds, ...(activeId ? [activeId] : [])]));
      if (idsToFetch.length === 0) {
        setConversations([]);
        return;
      }

      const results = await Promise.allSettled(
        idsToFetch.map(id => lookerBrowserSdk.ok(lookerBrowserSdk.get_conversation(id)))
      );

      const validConversations = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value && !r.value.deleted)
        .map(r => r.value)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setConversations(validConversations);

      // Clean up local storage if any cached IDs were deleted on the server
      const validIds = validConversations.map(c => c.id).filter(Boolean);
      if (validIds.length !== idsToFetch.length) {
        updateStorageCache(validIds.includes(activeId || '') ? activeId : (validIds[0] || null));
      }
    } catch (err: any) {
      console.warn('Failed to fetch conversation history:', err);
    }
  }, [lookerBrowserSdk, connectionState]);

  // 2. Select and load a specific conversation
  const selectConversation = useCallback(async (conversationId: string | null) => {
    if (!conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      latestVegaRef.current = null;
      setVisualization(null);
      updateStorageCache(null);
      return;
    }

    setActiveConversationId(conversationId);
    updateStorageCache(conversationId);
    setIsLoading(true);
    setError(null);

    try {
      if (lookerBrowserSdk && connectionState === 'connected') {
        const res = await lookerBrowserSdk.ok(
          lookerBrowserSdk.all_conversation_messages(conversationId)
        );
        const loadedMessages = extractCollection(res, 'messages');
        setMessages(processMessageFlow(loadedMessages));
      }
    } catch (err: any) {
      console.error(`Failed to load conversation ${conversationId}:`, err);
      setError('Failed to load conversation history.');
      // If conversation is deleted or invalid, remove from activeId
      setActiveConversationId(null);
      updateStorageCache(null);
      setMessages([]);
      latestVegaRef.current = null;
      setVisualization(null);
    } finally {
      setIsLoading(false);
    }
  }, [lookerBrowserSdk, connectionState, processMessageFlow]);

  // 3. Initial boot & restoration
  useEffect(() => {
    if (connectionState === 'connected' && lookerBrowserSdk) {
      refreshConversations();
      const cached = getStorageCache();
      if (cached.activeId) {
        selectConversation(cached.activeId);
      }
    }
  }, [connectionState, lookerBrowserSdk, refreshConversations, getStorageCache, selectConversation]);

  const prevBrandRef = useRef<string | null>(brand);

  // When selected brand changes, clear chat history so chats from prior brands aren't shown
  useEffect(() => {
    if (prevBrandRef.current !== null && prevBrandRef.current !== brand) {
      prevBrandRef.current = brand;
      setActiveConversationId(null);
      setMessages([]);
      setConversations([]);
      latestVegaRef.current = null;
      setVisualization(null);
      if (connectionState === 'connected' && lookerBrowserSdk) {
        refreshConversations();
      }
    } else {
      prevBrandRef.current = brand;
    }
  }, [brand, connectionState, lookerBrowserSdk, refreshConversations]);

  // 4. Create a new conversation (Strictly locked to CHAT_AGENT_ID)
  const createConversation = useCallback(async (name?: string) => {
    if (!lookerBrowserSdk) {
      setError('Looker SDK is not initialized.');
      return null;
    }
    setIsLoading(true);
    setError(null);

    try {
      const convName = name || `Conversation ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const newConv = await lookerBrowserSdk.ok(
        lookerBrowserSdk.create_conversation({
          agent_id: CHAT_AGENT_ID,
          category: 'conversation',
          name: convName,
        })
      );

      if (newConv && newConv.id) {
        setActiveConversationId(newConv.id);
        updateStorageCache(newConv.id, newConv.id);
        setMessages([]);
        latestVegaRef.current = null;
        setVisualization(null);
        setConversations(prev => [newConv, ...prev.filter(c => c.id !== newConv.id)]);
        return newConv;
      }
      throw new Error('No conversation ID returned from creation endpoint.');
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create new conversation.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [lookerBrowserSdk]);

  // 5. Stream Message Async Generator
  const streamMessage = useCallback(async function* (userMessageText: string): AsyncGenerator<any, void, unknown> {
    if (!lookerBrowserSdk || !userMessageText.trim()) return;
    setError(null);
    setIsChatting(true);
    networkStreamActiveRef.current = true;

    let targetConvId = activeConversationId;
    try {
      if (!targetConvId) {
        const newConv = await createConversation();
        if (!newConv || !newConv.id) {
          throw new Error('Failed to bootstrap conversation for message.');
        }
        targetConvId = newConv.id;
      }

      const isFirstMessage = !messagesRef.current.some(m => m.type === 'user' || m.message?.userMessage || (m as any).userMessage);
      const effectiveText = isFirstMessage
        ? `${userMessageText}\n\n[Instruction: The current application locale is ${language || 'English'}. Please use and respond for all messages with this locale.]`
        : userMessageText;

      const optimisticMsg: ConversationalMessageItem = {
        id: `optimistic_${Date.now()}`,
        type: 'user',
        timestamp: new Date().toISOString(),
        message: {
          timestamp: new Date().toISOString(),
          userMessage: { text: effectiveText }
        }
      };
      setMessages(prev => processMessageFlow([...prev, optimisticMsg]));

      const queue = new AsyncQueue<any>();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const producerPromise = (async () => {
        const yieldedBlocks: any[] = [];
        try {
          await streamLookerChat({
            sdk: lookerBrowserSdk,
            body: {
              conversation_id: targetConvId,
              user_message: effectiveText,
            },
            abortSignal: abortController.signal,
            onMessage: (block: any) => {
              yieldedBlocks.push(block);

              // 1. Check if block already exists in displayed state (immediate update)
              const existsInState = messagesRef.current.some(
                m => (m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId)
              );

              if (existsInState) {
                setMessages(prev => {
                  const updated = prev.map(m =>
                    ((m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId))
                      ? { ...m, ...block }
                      : m
                  );
                  return processMessageFlow(updated);
                });
                queue.enqueue(block);
                return;
              }

              // 2. Check if block already exists in incomingQueueRef (update in-place)
              const queueIdx = incomingQueueRef.current.findIndex(
                m => (m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId)
              );

              if (queueIdx !== -1) {
                incomingQueueRef.current[queueIdx] = {
                  ...incomingQueueRef.current[queueIdx],
                  ...block,
                };
                queue.enqueue(block);
                return;
              }

              // 3. Brand new block: push to queue and trigger staggered processing
              incomingQueueRef.current.push(block);
              queue.enqueue(block);

              if (!isProcessingQueueRef.current) {
                isProcessingQueueRef.current = true;
                processNextQueueItem();
              }
            },
          });

          if (abortController.signal.aborted) {
            return yieldedBlocks;
          }

          // Persist the user message and agent response blocks to Looker's conversation history
          try {
            const messagesToPersist = [
              {
                type: 'user',
                message: {
                  timestamp: new Date().toISOString(),
                  userMessage: { text: effectiveText }
                }
              },
              ...yieldedBlocks.map(block => ({
                type: block.type || (block.userMessage ? 'user' : 'system'),
                message: block.message || block
              }))
            ];

            if (messagesToPersist.length > 0) {
              await lookerBrowserSdk.ok(
                lookerBrowserSdk.create_conversation_message(targetConvId, {
                  messages: messagesToPersist
                })
              );
              // Sync canonical message history from server so official message IDs are stored locally
              const res = await lookerBrowserSdk.ok(
                lookerBrowserSdk.all_conversation_messages(targetConvId)
              );
              const loadedMessages = extractCollection(res, 'messages');
              if (loadedMessages && loadedMessages.length > 0) {
                setMessages(processMessageFlow(loadedMessages));
              }
              refreshConversations();
            }
          } catch (persistErr) {
            console.error('Failed to persist conversation messages:', persistErr);
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.error('Error in streamMessage producer:', err);
            setError(err.message || 'Failed to stream chat message.');
            queue.error(err);
          }
        } finally {
          abortControllerRef.current = null;
          networkStreamActiveRef.current = false;
          queue.close();
          if (incomingQueueRef.current.length === 0) {
            setIsChatting(false);
          }
        }
      })();

      while (true) {
        const { value, done } = await queue.dequeue();
        if (done) break;
        yield value;
      }

      await producerPromise;
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error in streamMessage consumer:', err);
        setError(err.message || 'Failed to stream chat message.');
      }
    } finally {
      networkStreamActiveRef.current = false;
      if (incomingQueueRef.current.length === 0) {
        setIsChatting(false);
      }
    }
  }, [lookerBrowserSdk, activeConversationId, createConversation, refreshConversations, language, processMessageFlow, processNextQueueItem]);

  // 6. Standard sendMessage (wraps generator for simple consumer calls)
  const sendMessage = useCallback(async (userMessageText: string, onStreamChunk?: (chunk: any) => void): Promise<ConversationalMessageItem[] | null> => {
    const generator = streamMessage(userMessageText);
    const accumulated: any[] = [];
    for await (const chunk of generator) {
      accumulated.push(chunk);
      if (onStreamChunk) onStreamChunk(chunk);
    }
    return accumulated;
  }, [streamMessage]);

  // 7. Update message helper
  const updateMessage = useCallback(async (messageId: string, body: any) => {
    if (!lookerBrowserSdk || !activeConversationId) return null;
    try {
      const updated = await lookerBrowserSdk.ok(
        lookerBrowserSdk.update_conversation_message(activeConversationId, messageId, body)
      );
      setMessages(prev => processMessageFlow(prev.map(m => (m.id === messageId || m.messageId === messageId ? { ...m, ...updated } : m))));
      return updated;
    } catch (err: any) {
      console.error(`Failed to update message ${messageId}:`, err);
      setError('Failed to update message.');
      return null;
    }
  }, [lookerBrowserSdk, activeConversationId, processMessageFlow]);

  // 8. Delete individual message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!lookerBrowserSdk || !activeConversationId) return false;
    try {
      await lookerBrowserSdk.ok(
        lookerBrowserSdk.delete_conversation_message(activeConversationId, messageId)
      );
      setMessages(prev => processMessageFlow(prev.filter(m => m.id !== messageId && m.messageId !== messageId)));
      return true;
    } catch (err: any) {
      console.error(`Failed to delete message ${messageId}:`, err);
      setError('Failed to delete message.');
      return false;
    }
  }, [lookerBrowserSdk, activeConversationId, processMessageFlow]);

  // 9. Delete full conversation
  const deleteConversation = useCallback(async (conversationId?: string): Promise<boolean> => {
    if (!lookerBrowserSdk) return false;
    const targetId = conversationId || activeConversationId;
    if (!targetId) return false;

    try {
      await lookerBrowserSdk.ok(lookerBrowserSdk.delete_conversation(targetId));
      setConversations(prev => prev.filter(c => c.id !== targetId));
      
      if (targetId === activeConversationId) {
        setActiveConversationId(null);
        setMessages([]);
        latestVegaRef.current = null;
        setVisualization(null);
        updateStorageCache(null);
      }
      return true;
    } catch (err: any) {
      console.error(`Failed to delete conversation ${targetId}:`, err);
      setError('Failed to delete conversation.');
      return false;
    }
  }, [lookerBrowserSdk, activeConversationId]);

  return {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isChatting,
    error,
    visualization,
    createConversation,
    selectConversation,
    sendMessage,
    streamMessage,
    updateMessage,
    deleteMessage,
    deleteConversation,
    refreshConversations,
    stopStreaming,
  };
}
