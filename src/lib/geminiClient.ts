/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiCache } from "./cache";

export type GeminiNoteAction = "summarize" | "improve" | "tags";

export interface GeminiNoteAssistRequest {
  action: GeminiNoteAction;
  title: string;
  content: string;
}

export interface GeminiNoteAssistResponse {
  summary: string;
  tags: string[];
  rewrittenContent?: string;
}

export async function requestGeminiNoteAssist(
  payload: GeminiNoteAssistRequest
): Promise<GeminiNoteAssistResponse> {
  // Generate cache key based on action and content
  const cacheKey = `gemini_${payload.action}_${payload.title}_${payload.content.substring(0, 50)}`;
  
  // Check cache first
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult as GeminiNoteAssistResponse;
  }

  const response = await fetch("/api/gemini/note-assist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Gemini request failed.");
  }

  const result = data as GeminiNoteAssistResponse;
  
  // Cache the successful response
  apiCache.set(cacheKey, result);
  
  return result;
}
