/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Note } from "../types";
import {
  Save,
  X,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Code,
  List,
  Quote,
  Eye,
  Edit3,
  Hash,
  Palette,
  Info,
  Loader2,
  Sparkles,
  Tags,
  WandSparkles
} from "lucide-react";
import { motion } from "motion/react";
import { GeminiNoteAction, GeminiNoteAssistResponse, requestGeminiNoteAssist } from "../lib/geminiClient";

interface EditorProps {
  note: Note | null; // null means we are creating a new note
  userId: string;
  onSave: (noteData: Omit<Note, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }) => void;
  onClose: () => void;
}

const PALETTE_COLORS = [
  { name: "Slate", value: "slate", border: "border-slate-800", bg: "bg-slate-900/40", text: "text-slate-400" },
  { name: "Violet", value: "violet", border: "border-violet-500/30", bg: "bg-violet-950/20", text: "text-violet-400" },
  { name: "Emerald", value: "emerald", border: "border-emerald-500/30", bg: "bg-emerald-950/20", text: "text-emerald-400" },
  { name: "Amber", value: "amber", border: "border-amber-500/30", bg: "bg-amber-950/20", text: "text-amber-400" },
  { name: "Rose", value: "rose", border: "border-rose-500/30", bg: "bg-rose-950/20", text: "text-rose-400" },
  { name: "Blue", value: "blue", border: "border-blue-500/30", bg: "bg-blue-950/20", text: "text-blue-400" }
];

export default function Editor({ note, userId, onSave, onClose }: EditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedColor, setSelectedColor] = useState("violet");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [aiResult, setAiResult] = useState<GeminiNoteAssistResponse | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiAction, setAiAction] = useState<GeminiNoteAction | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial values from the active note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTagsInput(note.tags.join(", "));
      setSelectedColor(note.color || "violet");
    } else {
      setTitle("");
      setContent("");
      setTagsInput("");
      setSelectedColor("violet");
    }
    setAiResult(null);
    setAiError("");
    setAiAction(null);
  }, [note]);

  // Insert markdown helpers helper function
  const insertMarkdown = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = textarea.value;

    let insertion = "";
    if (syntax === "h1") insertion = `# `;
    else if (syntax === "h2") insertion = `## `;
    else if (syntax === "bold") insertion = `**text**`;
    else if (syntax === "italic") insertion = `*text*`;
    else if (syntax === "code") insertion = `\`\`\`typescript\n// code block\n\`\`\``;
    else if (syntax === "list") insertion = `\n- Item 1\n- Item 2`;
    else if (syntax === "quote") insertion = `\n> quote here`;

    const newContent = text.substring(0, startPos) + insertion + text.substring(endPos);
    setContent(newContent);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + insertion.length, startPos + insertion.length);
    }, 10);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please specify a note title.");
      return;
    }

    const tagsArray = tagsInput
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const excerpt = content
      .replace(/[#*`>_\-]/g, "") // Strip markdown chars
      .substring(0, 140)
      .trim() + (content.length > 140 ? "..." : "");

    onSave({
      id: note ? note.id : `note-${Date.now()}`,
      title: title.trim(),
      content: content,
      excerpt: excerpt || "Empty description note.",
      tags: tagsArray,
      color: selectedColor,
      userId: userId,
      ...(note && { createdAt: note.createdAt, updatedAt: note.updatedAt })
    });
  };

  const handleGeminiAction = async (action: GeminiNoteAction) => {
    if (!content.trim()) {
      setAiError("Write note content before using Gemini.");
      return;
    }

    setAiAction(action);
    setAiError("");
    setAiResult(null);

    try {
      const result = await requestGeminiNoteAssist({
        action,
        title,
        content
      });

      setAiResult(result);

      if (action === "tags" && result.tags.length > 0) {
        setTagsInput(result.tags.join(", "));
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Gemini request failed.");
    } finally {
      setAiAction(null);
    }
  };

  const applyGeminiRewrite = () => {
    if (!aiResult?.rewrittenContent) return;
    setContent(aiResult.rewrittenContent);
    setViewMode("edit");
  };

  const insertGeminiSummary = () => {
    if (!aiResult?.summary) return;
    const summaryBlock = `> Gemini summary: ${aiResult.summary}\n\n`;
    setContent((current) => summaryBlock + current);
    setViewMode("edit");
  };

  // Simple, ultra-clean custom Markdown-like parser for accurate render preview inside the frame
  const renderMarkdownPreview = (text: string) => {
    if (!text) return <p className="text-slate-500 italic">No content written yet. Use the editor to begin.</p>;

    const lines = text.split("\n");
    let inList = false;
    let listItems: string[] = [];
    let inCode = false;
    let codeBuffer: string[] = [];

    const parsedElements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Code Block Toggles
      if (line.trim().startsWith("```")) {
        if (inCode) {
          parsedElements.push(
            <pre key={`code-${index}`} className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto my-3 p-3 leading-relaxed">
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          );
          codeBuffer = [];
          inCode = false;
        } else {
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeBuffer.push(line);
        return;
      }

      // Check List structure
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        inList = true;
        listItems.push(line.replace(/^[-*]\s+/, ""));
        return;
      } else {
        if (inList) {
          parsedElements.push(
            <ul key={`list-${index}`} className="list-disc pl-6 space-y-1 text-slate-300 my-3 text-sm">
              {listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
      }

      // H1 Header
      if (line.trim().startsWith("# ")) {
        parsedElements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-display font-semibold text-white mt-5 mb-3 border-b border-slate-800/60 pb-1 tracking-tight">
            {line.replace(/^#\s+/, "")}
          </h1>
        );
        return;
      }

      // H2 Header
      if (line.trim().startsWith("## ")) {
        parsedElements.push(
          <h2 key={`h2-${index}`} className="text-lg font-display font-semibold text-slate-100 mt-4 mb-2 tracking-tight">
            {line.replace(/^##\s+/, "")}
          </h2>
        );
        return;
      }

      // Block Quotes
      if (line.trim().startsWith("> ")) {
        parsedElements.push(
          <blockquote key={`quote-${index}`} className="border-l-4 border-violet-500 bg-slate-950/40 px-4 py-2 italic text-slate-400 rounded-r-lg my-3 font-sans text-xs">
            {line.replace(/^>\s+/, "")}
          </blockquote>
        );
        return;
      }

      // Table formatting check helper
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        // Render simple table or render raw table cells gracefully
        const columns = line.split("|").map(col => col.trim()).filter(col => col !== "");
        const isHeaderSeparator = columns.every(col => col.startsWith("-") || col.startsWith(":-") || col.endsWith("-"));
        
        if (!isHeaderSeparator) {
          parsedElements.push(
            <div key={`table-row-${index}`} className="overflow-x-auto my-1">
              <table className="min-w-full divide-y divide-slate-800 font-mono text-xs">
                <tbody>
                  <tr className="bg-slate-900/20 text-slate-300 border-b border-slate-800">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-3 py-1.5 whitespace-nowrap border-r border-slate-800/50 last:border-0">{col}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
        return;
      }

      // Empty Lines
      if (!line.trim()) {
        parsedElements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Standard Content text with inline formats (bold, code keywords, checks)
      let elementContent = line;
      
      // Render simple inline code `var`
      const inlineCodeRegex = /`([^`]+)`/g;
      
      // Render simple bold **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      
      // Render checkbox checklists e.g., - [x] done or - [ ] undone
      const isChecked = line.trim().startsWith("[x]") || line.trim().startsWith("- [x]");
      const isUnchecked = line.trim().startsWith("[ ]") || line.trim().startsWith("- [ ]");

      if (isChecked) {
        parsedElements.push(
          <div key={`check-${index}`} className="flex items-center gap-2.5 my-1 text-sm text-slate-400 font-sans line-through opacity-65">
            <input type="checkbox" checked={true} readOnly={true} className="rounded accent-emerald-500 w-4 h-4" />
            <span>{line.replace(/^.*?\[x\]\s+/, "")}</span>
          </div>
        );
        return;
      } else if (isUnchecked) {
        parsedElements.push(
          <div key={`check-${index}`} className="flex items-center gap-2.5 my-1 text-sm text-slate-200 font-sans">
            <input type="checkbox" checked={false} readOnly={true} className="rounded border-slate-800 w-4 h-4 bg-transparent text-violet-500 focus:ring-0 cursor-default" />
            <span>{line.replace(/^.*?\[ \]\s+/, "")}</span>
          </div>
        );
        return;
      }

      parsedElements.push(
        <p key={`p-${index}`} className="text-slate-300 leading-relaxed font-sans text-sm my-1 break-words">
          {line.split(" ").map((word, wIdx) => {
            // Find matches for bold/inline code
            if (word.startsWith("**") && word.endsWith("**") && word.length > 4) {
              return <strong key={wIdx} className="text-white font-semibold mr-1">{word.replace(/\*\*/g, "")}</strong>;
            }
            if (word.startsWith("`") && word.endsWith("`") && word.length > 2) {
              return <code key={wIdx} className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-rose-400 font-mono border border-slate-800 mr-1">{word.replace(/`/g, "")}</code>;
            }
            return word + " ";
          })}
        </p>
      );
    });

    return <div className="space-y-1">{parsedElements}</div>;
  };

  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div id="editor-modal-mask" className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex justify-end z-[999] p-4 max-md:p-0">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="w-full max-w-2xl bg-[#18181b] border border-[#27272a] max-md:border-0 rounded-lg max-md:rounded-none h-full flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Editor Modals Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex justify-between items-center bg-[#09090b]/40">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-${selectedColor === "violet" ? "purple" : selectedColor === "rose" ? "red" : selectedColor === "slate" ? "zinc" : selectedColor}-500 shadow-md shadow-blue-500/50 animate-pulse`} />
            <h3 className="font-display font-medium text-xs text-[#fafafa]">
              {note ? "Revise Note Structure" : "Compile New Brain Node"}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Modes tabs */}
            <div className="bg-[#09090b] rounded-md p-0.5 border border-[#27272a] flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  viewMode === "edit"
                    ? "bg-[#27272a] text-white font-semibold"
                    : "text-[#a1a1aa] hover:text-[#fafafa]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-[#27272a] text-white font-semibold"
                    : "text-[#a1a1aa] hover:text-[#fafafa]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Verify Form</span>
              </button>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Main Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Accent Palette Customizer */}
          <div className="flex items-center justify-between bg-[#09090b]/20 p-3 rounded-lg border border-[#27272a]">
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Palette className="w-4 h-4 text-[#71717a]" />
              <span>Color Coordination tag:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {PALETTE_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                  className={`w-5 h-5 rounded transition-all scale-95 border cursor-pointer hover:scale-105 ${
                    selectedColor === color.value
                      ? "bg-" + color.value + "-500 border-white ring-2 ring-blue-500/30 scale-100"
                      : "bg-" + color.value + "-950/40 border-zinc-700 hover:border-zinc-500"
                  }`}
                  style={{
                    backgroundColor: 
                      color.value === "slate" ? "#1e293b" :
                      color.value === "violet" ? "#6d28d9" :
                      color.value === "emerald" ? "#047857" :
                      color.value === "amber" ? "#b45309" :
                      color.value === "rose" ? "#be123c" : "#2563eb"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Gemini AI assistant */}
          <div className="bg-[#09090b]/30 border border-blue-500/20 rounded-lg p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#d4d4d8]">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">Gemini AI</span>
                <span className="text-[#71717a]">note assistant</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGeminiAction("summarize")}
                  disabled={aiAction !== null}
                  title="Summarize note"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-[11px] text-[#d4d4d8] hover:text-white hover:border-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {aiAction === "summarize" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Summarize</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGeminiAction("improve")}
                  disabled={aiAction !== null}
                  title="Improve markdown"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-[11px] text-[#d4d4d8] hover:text-white hover:border-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {aiAction === "improve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WandSparkles className="w-3.5 h-3.5" />}
                  <span>Improve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGeminiAction("tags")}
                  disabled={aiAction !== null}
                  title="Suggest tags"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-[11px] text-[#d4d4d8] hover:text-white hover:border-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {aiAction === "tags" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tags className="w-3.5 h-3.5" />}
                  <span>Tags</span>
                </button>
              </div>
            </div>

            {aiError && (
              <p className="text-[11px] text-red-300 bg-red-950/20 border border-red-500/20 rounded-md px-3 py-2">
                {aiError}
              </p>
            )}

            {aiResult && (
              <div className="rounded-md border border-[#27272a] bg-[#18181b]/70 p-3 space-y-2">
                {aiResult.summary && (
                  <p className="text-xs text-[#d4d4d8] leading-relaxed">
                    {aiResult.summary}
                  </p>
                )}
                {aiResult.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-blue-950/30 border border-blue-500/20 text-[10px] text-blue-300 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiResult.rewrittenContent && (
                    <button
                      type="button"
                      onClick={applyGeminiRewrite}
                      className="px-2.5 py-1 rounded bg-white text-black text-[11px] font-semibold hover:bg-[#fafafa] transition cursor-pointer"
                    >
                      Apply rewrite
                    </button>
                  )}
                  {aiResult.summary && (
                    <button
                      type="button"
                      onClick={insertGeminiSummary}
                      className="px-2.5 py-1 rounded bg-[#09090b] border border-[#27272a] text-[#d4d4d8] text-[11px] font-semibold hover:text-white transition cursor-pointer"
                    >
                      Insert summary
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title Editor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#71717a] font-display uppercase tracking-wider block">Notes Title Input</label>
            <input
              type="text"
              placeholder="e.g. AWS Multi-Region Replication Architecture..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-[#fafafa] font-display font-medium text-lg border-b border-[#27272a] focus:border-blue-500 pb-2 outline-none transition placeholder-[#52525b]"
            />
          </div>

          {/* Editor Mode vs View Mode */}
          {viewMode === "edit" ? (
            <div className="flex flex-col h-[60%] space-y-2">
              {/* WYSIWYG helper bar */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#09090b] rounded-lg border border-[#27272a]">
                <button
                  onClick={() => insertMarkdown("h1")}
                  type="button"
                  title="Insert Header 1"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown("h2")}
                  type="button"
                  title="Insert Header 2"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-[#27272a] mx-1" />
                <button
                  onClick={() => insertMarkdown("bold")}
                  type="button"
                  title="Toggle Bold text"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown("italic")}
                  type="button"
                  title="Toggle Italic text"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-[#27272a] mx-1" />
                <button
                  onClick={() => insertMarkdown("code")}
                  type="button"
                  title="Insert Code Block"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown("list")}
                  type="button"
                  title="Insert Unordered list"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown("quote")}
                  type="button"
                  title="Insert blockquote block"
                  className="p-1.5 rounded text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
                >
                  <Quote className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex items-center gap-1 ml-auto text-[9px] font-mono text-[#71717a] px-3 py-1">
                  <Info className="w-3.5 h-3.5 text-[#71717a]" />
                  <span>Supports standard markdown formatting</span>
                </div>
              </div>

              {/* Text Writing Canvas */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Dynamic Brain Sheet&#10;&#10;Use headings, check lists, table rows or copy and paste scripts directly. Use markdown controls above for quick helpers."
                className="w-full flex-1 min-h-[350px] bg-[#09090b]/40 border border-[#27272a] focus:border-blue-500 rounded-lg p-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none resize-none font-mono leading-relaxed"
              />
            </div>
          ) : (
            <div className="min-h-[350px] bg-[#09090b]/20 border border-[#27272a] rounded-lg p-5 overflow-y-auto max-h-[500px]">
              {renderMarkdownPreview(content)}
            </div>
          )}

          {/* Tags management */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block">
              <Hash className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Comma Separated Labels (Tags)</span>
            </div>
            <input
              type="text"
              placeholder="e.g. database, express, security, backend"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-4 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition"
            />
          </div>
        </div>

        {/* Editor Modals Footer */}
        <div className="px-6 py-4 border-t border-[#27272a] flex justify-between items-center bg-[#09090b]/30">
          <div className="flex gap-4 font-mono text-[9px] text-[#71717a]">
            <span>CHARACTERS: <strong className="text-[#a1a1aa]">{characterCount}</strong></span>
            <span>WORDS: <strong className="text-[#a1a1aa]">{wordCount}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1.5 rounded text-xs font-semibold text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="bg-white hover:bg-[#fafafa] text-black px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Commit Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
