/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from "react";
import { User, Note } from "../types";
import { LogOut, Tags, LayoutDashboard, Brain, RefreshCw, Settings } from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  currentUser: User;
  notes: Note[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onResetDatabase?: () => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export default React.memo(function Sidebar({
  currentUser,
  notes,
  selectedTag,
  onSelectTag,
  onLogout,
  onOpenProfile,
  onResetDatabase,
  mobileMenuOpen,
  onToggleMobileMenu
}: SidebarProps) {
  // Extract user-specific tags dynamically with memoization
  const userNotes = useMemo(() => notes.filter((n) => n.userId === currentUser.id), [notes, currentUser.id]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    userNotes.forEach((note) => {
      note.tags.forEach((tag) => {
        const normalized = tag.toLowerCase().trim();
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });

    return counts;
  }, [userNotes]);

  // Memoized callbacks
  const handleSelectTag = useCallback((tag: string | null) => {
    onSelectTag(tag);
  }, [onSelectTag]);

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const handleOpenProfile = useCallback(() => {
    onOpenProfile();
  }, [onOpenProfile]);

  const handleResetDatabase = useCallback(() => {
    if (onResetDatabase) {
      onResetDatabase();
    }
  }, [onResetDatabase]);

  const uniqueTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const sidebarContent = (
    <>
      {/* Top Brand Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 px-2 py-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center ring-1 ring-blue-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-sm text-[#fafafa] tracking-wide">
                Second Brain
              </h1>
              <span className="text-[9px] text-[#71717a] font-mono tracking-wider uppercase block">
                Node V.2.1.0_PROD
              </span>
            </div>
          </div>
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 rounded text-[#71717a] hover:text-white hover:bg-[#27272a] transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 flex items-center gap-3 relative overflow-hidden group">
          <img
            src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-[#27272a] group-hover:border-blue-500/50 transition-colors"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[#fafafa] truncate font-sans">
              {currentUser.name}
            </h4>
            <p className="text-[10px] text-[#71717a] truncate font-mono">
              {currentUser.email}
            </p>
            {currentUser.headline && (
              <p className="text-[10px] text-blue-400 truncate mt-0.5">
                {currentUser.headline}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleOpenProfile}
            title="Edit profile"
            className="p-1.5 rounded text-[#71717a] hover:text-white hover:bg-[#27272a] transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Navigation Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest px-2 block mb-2">
            Workspace
          </span>
          <button
            onClick={() => { handleSelectTag(null); if (onToggleMobileMenu) onToggleMobileMenu(); }}
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedTag === null
                ? "bg-[#18181b] text-white border border-[#27272a]"
                : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Full Dashboard</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-[#09090b] text-[#71717a] font-mono text-[9px] border border-[#27272a]/40">
              {userNotes.length}
            </span>
          </button>
        </div>

        {/* Dynamic Tags Filter list */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">
              Brain Cells (Tags)
            </span>
            <Tags className="w-3.5 h-3.5 text-[#71717a]" />
          </div>
          
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {uniqueTags.length === 0 ? (
              <span className="text-[11px] text-[#71717a] italic px-2 block mt-1">No tags defined yet.</span>
            ) : (
              uniqueTags.map(([tag, count]) => {
                const isActive = selectedTag?.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => { handleSelectTag(isActive ? null : tag); if (onToggleMobileMenu) onToggleMobileMenu(); }}
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition cursor-pointer capitalize ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                        : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                      <span className="truncate">{tag}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#09090b] text-[#71717a] font-mono text-[9px] border border-[#27272a]/40">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer Operations */}
      <div className="pt-4 border-t border-[#27272a] space-y-2">
        {onResetDatabase && (
          <button
            onClick={handleResetDatabase}
            title="Reset storage to original seeded states"
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#71717a] hover:text-white hover:bg-[#18181b] transition cursor-pointer border border-transparent"
          >
            <RefreshCw className="w-4 h-4 text-[#71717a]" />
            <span>Reset Database Seed</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition cursor-pointer border border-transparent"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Exit Workspace</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onToggleMobileMenu}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#09090b] border-r border-[#27272a] flex flex-col select-none p-4 shrink-0 justify-between transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div id="app-sidebar" className="hidden md:flex w-64 bg-[#09090b] border-r border-[#27272a] flex-col h-screen select-none p-4 shrink-0 justify-between">
        {sidebarContent}
      </div>
    </>
  );
});
