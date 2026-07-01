import { useState, useEffect, useCallback } from 'react';
import { usePortal } from '../context/PortalContext';
import { CHAT_AGENT_ID } from '../config/constants';
import { Looker40SDKStream } from '@looker/sdk/lib/4.0/streams';
import type { UseConversationalAnalyticsReturn, ConversationalMessageItem, CachedConversationsStorage } from '../types';

const STORAGE_KEY = 'looker_ca_cached_conversations';

export function useConversationalAnalytics(): UseConversationalAnalyticsReturn {
  const { lookerBrowserSdk, connectionState } = usePortal();

  // Local storage cache helper
  const getStorageCache = (): CachedConversationsStorage => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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
  };

  const updateStorageCache = (activeId: string | null, newIdToAdd?: string) => {
    try {
      const current = getStorageCache();
      const idSet = new Set(current.cachedIds);
      if (newIdToAdd) idSet.add(newIdToAdd);
      if (activeId) idSet.add(activeId);
      
      const updated: CachedConversationsStorage = {
        activeId,
        cachedIds: Array.from(idSet),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error updating localStorage cache:', e);
    }
  };

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return getStorageCache().activeId;
  });
  const [messages, setMessages] = useState<ConversationalMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        setMessages(loadedMessages);
      }
    } catch (err: any) {
      console.error(`Failed to load conversation ${conversationId}:`, err);
      setError('Failed to load conversation history.');
      // If conversation is deleted or invalid, remove from activeId
      setActiveConversationId(null);
      updateStorageCache(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [lookerBrowserSdk, connectionState]);

  // 3. Initial boot & restoration
  useEffect(() => {
    if (connectionState === 'connected' && lookerBrowserSdk) {
      refreshConversations();
      const cached = getStorageCache();
      if (cached.activeId) {
        selectConversation(cached.activeId);
      }
    }
  }, [connectionState, lookerBrowserSdk]);

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

  // Helper: Bracket-matching JSON block extractor (only extracts JSON objects '{...}' to ensure real-time streaming)
  const extractJsonBlocks = (buffer: string): { blocks: any[]; remaining: string } => {
    const blocks: any[] = [];
    let remaining = buffer;

    while (remaining.length > 0) {
      const startIndex = remaining.indexOf('{');
      if (startIndex === -1) break;

      let depth = 0;
      let inString = false;
      let escaped = false;
      let foundEnd = -1;

      for (let i = startIndex; i < remaining.length; i++) {
        const char = remaining[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\' && inString) {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              foundEnd = i;
              break;
            }
          }
        }
      }

      if (foundEnd !== -1) {
        const candidate = remaining.slice(startIndex, foundEnd + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            blocks.push(parsed);
          }
          remaining = remaining.slice(foundEnd + 1);
        } catch (e) {
          remaining = remaining.slice(startIndex + 1);
        }
      } else {
        if (startIndex > 0) {
          remaining = remaining.slice(startIndex);
        }
        break;
      }
    }

    return { blocks, remaining };
  };

  // 5. Stream Message Async Generator
  const streamMessage = useCallback(async function* (userMessageText: string): AsyncGenerator<any, void, unknown> {
    if (!lookerBrowserSdk || !userMessageText.trim()) return;
    setError(null);
    setIsChatting(true);

    let targetConvId = activeConversationId;
    try {
      if (!targetConvId) {
        const newConv = await createConversation();
        if (!newConv || !newConv.id) {
          throw new Error('Failed to bootstrap conversation for message.');
        }
        targetConvId = newConv.id;
      }

      const optimisticMsg: ConversationalMessageItem = {
        id: `optimistic_${Date.now()}`,
        type: 'user',
        timestamp: new Date().toISOString(),
        message: {
          timestamp: new Date().toISOString(),
          userMessage: { text: userMessageText }
        }
      };
      setMessages(prev => [...prev, optimisticMsg]);

      const streamSdk = new Looker40SDKStream(lookerBrowserSdk.authSession);
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      const yieldedBlocks: any[] = [];

      await streamSdk.conversational_analytics_chat(
        async (response: Response) => {
          if (!response.body) return [];
          const reader = response.body.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const { blocks, remaining } = extractJsonBlocks(buffer);
            buffer = remaining;

            for (const block of blocks) {
              yieldedBlocks.push(block);
              setMessages(prev => {
                const isExisting = prev.some(m => (m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId));
                if (isExisting) {
                  return prev.map(m => ((m.id && m.id === block.id) || (m.messageId && m.messageId === block.messageId)) ? { ...m, ...block } : m);
                }
                return [...prev, block];
              });
            }
          }
          return yieldedBlocks;
        },
        {
          conversation_id: targetConvId,
          user_message: userMessageText,
        }
      );

      for (const block of yieldedBlocks) {
        yield block;
      }

      // Persist the user message and agent response blocks to Looker's conversation history
      try {
        const messagesToPersist = [
          {
            type: 'user',
            message: {
              timestamp: new Date().toISOString(),
              userMessage: { text: userMessageText }
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
            setMessages(loadedMessages);
          }
          refreshConversations();
        }
      } catch (persistErr) {
        console.error('Failed to persist conversation messages:', persistErr);
      }
    } catch (err: any) {
      console.error('Error in streamMessage:', err);
      setError(err.message || 'Failed to stream chat message.');
    } finally {
      setIsChatting(false);
    }
  }, [lookerBrowserSdk, activeConversationId, createConversation, refreshConversations]);

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
      setMessages(prev => prev.map(m => (m.id === messageId || m.messageId === messageId ? { ...m, ...updated } : m)));
      return updated;
    } catch (err: any) {
      console.error(`Failed to update message ${messageId}:`, err);
      setError('Failed to update message.');
      return null;
    }
  }, [lookerBrowserSdk, activeConversationId]);

  // 8. Delete individual message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!lookerBrowserSdk || !activeConversationId) return false;
    try {
      await lookerBrowserSdk.ok(
        lookerBrowserSdk.delete_conversation_message(activeConversationId, messageId)
      );
      setMessages(prev => prev.filter(m => m.id !== messageId && m.messageId !== messageId));
      return true;
    } catch (err: any) {
      console.error(`Failed to delete message ${messageId}:`, err);
      setError('Failed to delete message.');
      return false;
    }
  }, [lookerBrowserSdk, activeConversationId]);

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
    createConversation,
    selectConversation,
    sendMessage,
    streamMessage,
    updateMessage,
    deleteMessage,
    deleteConversation,
    refreshConversations,
  };
}
