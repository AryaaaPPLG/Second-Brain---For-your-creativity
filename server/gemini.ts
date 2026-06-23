/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

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

const MODEL_NAME = "gemini-2.5-flash";
const MAX_CONTENT_LENGTH = 20000;

function getInstruction(action: GeminiNoteAction) {
  if (action === "summarize") {
    return "Summarize the note into a concise, useful second-brain excerpt.";
  }

  if (action === "improve") {
    return "Rewrite the note content to be clearer, better structured, and still faithful to the original ideas. Preserve markdown.";
  }

  return "Suggest precise lowercase tags for organizing this note.";
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
}

function normalizeResponse(value: unknown): GeminiNoteAssistResponse {
  const data = value as Partial<GeminiNoteAssistResponse>;

  return {
    summary: typeof data.summary === "string" ? data.summary.trim() : "",
    tags: Array.isArray(data.tags)
      ? data.tags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 8)
      : [],
    rewrittenContent:
      typeof data.rewrittenContent === "string"
        ? data.rewrittenContent.trim()
        : undefined
  };
}

export async function assistNoteWithGemini(
  request: GeminiNoteAssistRequest,
  apiKey: string
): Promise<GeminiNoteAssistResponse> {
  const title = request.title?.trim() || "Untitled note";
  const content = request.content?.trim();

  if (!["summarize", "improve", "tags"].includes(request.action)) {
    throw new Error("Unsupported Gemini note action.");
  }

  if (!content) {
    throw new Error("Write note content before using Gemini.");
  }

  const clippedContent = content.slice(0, MAX_CONTENT_LENGTH);
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "You are an assistant inside a markdown second-brain note app.",
              getInstruction(request.action),
              "Return only valid JSON with this shape:",
              '{"summary":"short excerpt","tags":["tag-one"],"rewrittenContent":"optional markdown"}',
              "For summarize and tags actions, omit rewrittenContent unless a rewrite is useful.",
              `Title: ${title}`,
              "Markdown content:",
              clippedContent
            ].join("\n\n")
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      temperature: request.action === "tags" ? 0.2 : 0.4
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return normalizeResponse(JSON.parse(extractJson(text)));
}
