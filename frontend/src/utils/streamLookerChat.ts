import { API_BASE_URL } from '../config/constants';

export interface StreamLookerChatOptions {
  sdk: any;
  body: Record<string, any>;
  onMessage: (chunk: any) => void;
  abortSignal?: AbortSignal;
}

/**
 * Extracts complete top-level JSON objects (`{ ... }`) from a streaming buffer,
 * safely respecting JSON string literals and escaped characters.
 */
function extractCompleteJsonObjects(buffer: string): { blocks: any[]; remaining: string } {
  const blocks: any[] = [];
  let remaining = buffer;

  while (true) {
    const startIndex = remaining.indexOf('{');
    if (startIndex === -1) {
      break;
    }

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
      remaining = remaining.slice(startIndex);
      break;
    }
  }

  return { blocks, remaining };
}

/**
 * Streams chat responses from `/conversational_analytics/chat` using authenticated Looker transport (`sdk.authStream`).
 * Decodes streamed chunks in real time over `ReadableStream` and immediately invokes `onMessage` for every JSON chunk.
 */
export async function streamLookerChat({
  sdk,
  body,
  onMessage,
  abortSignal,
}: StreamLookerChatOptions): Promise<any[]> {
  const accumulated: any[] = [];

  let token: string | undefined;
  if (sdk.authSession && typeof sdk.authSession.getToken === 'function') {
    token = await sdk.authSession.getToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream, application/json, */*',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/api/agents/chat`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`Chat stream failed (${response.status}): ${response.statusText}`);
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error('ReadableStream is not supported on this response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (abortSignal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      const { blocks, remaining } = extractCompleteJsonObjects(buffer);
      buffer = remaining;

      for (const block of blocks) {
        accumulated.push(block);
        onMessage(block);
      }

      if (done) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              accumulated.push(parsed);
              onMessage(parsed);
            }
          } catch (e) {
            // ignore trailing incomplete or invalid text
          }
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}
