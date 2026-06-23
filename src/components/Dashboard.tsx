/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from "react";
import { User, Note } from "../types";
import {
  Search,
  Plus,
  BookOpen,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  FileText,
  Activity,
  UserCheck,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { debounce } from "../lib/debounce";

interface DashboardProps {
  currentUser: User;
  notes: Note[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onEditNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; lightBg: string }> = {
  slate: { border: "border-[#27272a]", bg: "bg-[#18181b]", text: "text-[#a1a1aa]", lightBg: "bg-[#27272a]/50" },
  violet: { border: "border-[#27272a] hover:border-purple-500/30", bg: "bg-[#18181b]", text: "text-purple-400 font-medium", lightBg: "bg-purple-950/30 border border-purple-550/20" },
  emerald: { border: "border-[#27272a] hover:border-emerald-500/30", bg: "bg-[#18181b]", text: "text-emerald-400 font-medium", lightBg: "bg-emerald-950/30 border border-emerald-550/20" },
  amber: { border: "border-[#27272a] hover:border-amber-500/30", bg: "bg-[#18181b]", text: "text-amber-400 font-medium", lightBg: "bg-amber-950/30 border border-amber-550/20" },
  rose: { border: "border-[#27272a] hover:border-red-500/30", bg: "bg-[#18181b]", text: "text-red-400 font-medium", lightBg: "bg-red-950/30 border border-red-550/20" },
  blue: { border: "border-[#27272a] hover:border-blue-500/30", bg: "bg-[#18181b]", text: "text-blue-400 font-medium", lightBg: "bg-blue-950/30 border border-blue-550/20" }
};

export default React.memo(function Dashboard({
  currentUser,
  notes,
  selectedTag,
  onSelectTag,
  onEditNote,
  onCreateNote,
  onDeleteNote
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // ISOLATION: Strict filter for the current user's notes only
  const userNotes = useMemo(() => notes.filter((n) => n.userId === currentUser.id), [notes, currentUser.id]);

  // Apply Search + Tag filters with memoization
  const filteredNotes = useMemo(() => {
    return userNotes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === null ||
        note.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    });
  }, [userNotes, searchQuery, selectedTag]);

  // Calculate stats with memoization
  const stats = useMemo(() => {
    const totalNotes = userNotes.length;
    const tagSet = new Set<string>();
    userNotes.forEach((n) => n.tags.forEach((t) => tagSet.add(t.toLowerCase().trim())));
    const totalTags = tagSet.size;

    return { totalNotes, totalTags };
  }, [userNotes]);

  // Memoized callbacks
  const handleCreateNote = useCallback(() => {
    onCreateNote();
  }, [onCreateNote]);

  const handleEditNote = useCallback((note: Note) => {
    onEditNote(note);
  }, [onEditNote]);

  const handleDeleteNote = useCallback((noteId: string) => {
    onDeleteNote(noteId);
  }, [onDeleteNote]);

  // Formatting date nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Jun 23, 2026";
    }
  };

  return (
    <div id="dashboard-space" className="flex-1 bg-[#09090b] p-8 max-md:p-4 overflow-y-auto h-screen overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[128px] pointer-events-none" />

      {/* Header and Quick Tools */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-blue-500 font-mono text-[10px] tracking-widest uppercase block mb-1">
            Isolated Sandbox
          </span>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight flex items-center gap-2">
            Secure Nodes Dashboard
          </h1>
          <p className="text-[#a1a1aa] text-xs mt-1">
            Analyzing index workspace for <span className="text-[#fafafa] font-semibold">{currentUser.name}</span>. Encryption protocol active.
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          type="button"
          className="bg-white hover:bg-[#fafafa] text-black px-4 py-2.5 rounded-lg text-xs font-semibold select-none flex items-center gap-2 cursor-pointer shadow-sm self-stretch md:self-auto justify-center transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Mental Node</span>
        </button>
      </div>

      {/* Statistics Section Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Total stats */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex items-center gap-4 hover:border-[#71717a]/30 transition">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Note Density</span>
            <h4 className="text-lg font-display font-semibold text-white mt-0.5">{stats.totalNotes} allocated</h4>
          </div>
        </div>

        {/* Unique tags */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex items-center gap-4 hover:border-[#71717a]/30 transition">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Cognitive Span</span>
            <h4 className="text-lg font-display font-semibold text-white mt-0.5">{stats.totalTags} unique labels</h4>
          </div>
        </div>

        {/* Status widget */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex items-center gap-4 hover:border-[#71717a]/30 transition col-span-1">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Last Commit Activity</span>
            <h4 className="text-xs font-display font-semibold text-[#fafafa] mt-0.5 truncate max-w-[180px]">
              {filteredNotes.length > 0 ? formatDate(filteredNotes[0].updatedAt) : "Idle Sandbox"}
            </h4>
          </div>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#71717a]" />
          <input
            type="text"
            placeholder="Search within note titles and code blocks securely..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] hover:border-[#71717a]/40 focus:border-blue-500 rounded-lg py-3 pl-12 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition"
          />
        </div>

        {/* Selected tag visual feedback */}
        {selectedTag && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#71717a]">Filtered by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 capitalize">
              <span>{selectedTag}</span>
              <button
                onClick={() => onSelectTag(null)}
                className="hover:text-blue-200 font-bold ml-1 cursor-pointer"
                title="Clear filter"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Bento Grid Notes List */}
      <AnimatePresence mode="popLayout">
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[#27272a] rounded-lg bg-[#18181b]/20"
          >
            <div className="w-10 h-10 rounded-lg bg-[#18181b] flex items-center justify-center border border-[#27272a] mb-4">
              <BookOpen className="w-5 h-5 text-[#71717a]" />
            </div>
            <h3 className="font-display font-medium text-[#fafafa] text-sm">No notes available in this search index</h3>
            <p className="text-[#71717a] text-xs mt-1 max-w-xs leading-relaxed">
              Either create a new note node or expand your search criteria to index inactive records.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => {
              const themeColor = COLOR_MAP[note.color || "violet"] || COLOR_MAP.violet;
              return (
                <motion.div
                  key={note.id}
                  layoutId={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={`bg-[#18181b] border ${themeColor.border} rounded-lg p-5 flex flex-col justify-between hover:shadow-xl group transition relative overflow-hidden`}
                >
                  {/* Subtle light layer reflecting color */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      height: "2px",
                      background: 
                        note.color === "slate" ? "#475569" :
                        note.color === "violet" ? "#8b5cf6" :
                        note.color === "emerald" ? "#10b981" :
                        note.color === "amber" ? "#f59e0b" :
                        note.color === "rose" ? "#f43f5e" : "#2563eb"
                    }}
                  />

                  {/* Note Title & Info */}
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2.5">
                      <h3
                        onClick={() => handleEditNote(note)}
                        className="font-display font-semibold text-[#fafafa] text-xs tracking-tight cursor-pointer hover:text-blue-400 transition"
                      >
                        {note.title}
                      </h3>
                      
                      {/* Action controllers */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditNote(note)}
                          title="Edit Node"
                          type="button"
                          className="p-1 rounded bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          title="Expunge Node"
                          type="button"
                          className="p-1 rounded bg-red-950/30 text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[#a1a1aa] text-xs leading-relaxed line-clamp-3 font-sans mb-4">
                      {note.excerpt}
                    </p>
                  </div>

                  {/* Note Footer metadata */}
                  <div className="pt-4 border-t border-[#27272a] flex flex-wrap justify-between items-center gap-2">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-[#71717a] font-mono text-[9px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(note.createdAt)}</span>
                    </div>

                    {/* Badge Tags list */}
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => onSelectTag(tag)}
                          type="button"
                          className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded capitalize cursor-pointer transition ${themeColor.lightBg} ${themeColor.text}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
