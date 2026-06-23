/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getNotes, getDashboardStats } from "@/src/actions/note";

// Importing Shadcn UI, Lucide icons, and Client modules
import { Brain, Sparkles, FolderLock, PlusCircle, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button"; // Standard Shadcn UI Primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

// Client-side Interactive Dashboard components containing state for searches, writing, and sliders
import Sidebar from "@/src/components/sidebar";
import NotesGrid from "@/src/components/notes-grid";

interface DashboardPageProps {
  searchParams: Promise<{
    tag?: string;
  }>;
}

/**
 * NEXT.JS SECURE SERVER COMPONENT: Main Dashboard Entry Gate
 * Fetches secure database coordinates beforehand to eliminate delay flickers, ensuring SEO & performant indexing.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // 1. Authenticate session securely on the Server limit
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/"); // Force reroute if invalid
  }

  const params = await searchParams;
  const activeTag = params.tag || null;

  // 2. Query isolated note streams from database (Strict IDOR protection guaranteed within the action)
  const notesResponse = await getNotes(activeTag);
  const statsResponse = await getDashboardStats();

  if (!notesResponse.success || !statsResponse.success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-center p-6">
        <FolderLock className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white font-display">Database Sync Outage</h2>
        <p className="text-slate-400 text-sm mt-1 max-w-xs">
          An error occurred while loading your secure mental nodes interface. Please retry or contact administration.
        </p>
        <Button className="mt-4 bg-violet-600 hover:bg-violet-500 text-xs">
          Reconnect System
        </Button>
      </div>
    );
  }

  const initialNotes = notesResponse.data || [];
  const initialStats = statsResponse.data || { totalNotes: 0, totalTags: 0, tagsBreakdown: [] };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex overflow-hidden">
      {/* 
        SIDEBAR COMPONENT:
        Dynamic left panel passing in current real-time session profiles and active tags list.
      */}
      <Sidebar 
        currentUser={{
          id: session.user.id,
          name: session.user.name || "Operator",
          email: session.user.email || "unknown@domain.com",
          avatarUrl: session.user.image || undefined
        }} 
        notesCount={initialStats.totalNotes}
        tagsList={initialStats.tagsBreakdown}
        activeTag={activeTag}
      />

      {/* 
        MAIN CONTENT VIEWSTAGE:
        Includes full-text search systems, stats meters, bento note cards grid, and custom TipTap editors.
      */}
      <main className="flex-1 overflow-y-auto px-8 py-8 max-md:px-4 relative flex flex-col">
        {/* Absolute visual ambient glow behind cards */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[128px] pointer-events-none" />

        {/* Dashboard top hero banner details */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono tracking-widest uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TLS ENCRYPTED SANDBOX ACTIVE</span>
            </div>
            <h1 className="font-display font-medium text-3xl tracking-tight text-white">
              My Cognitive Space
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Welcome back, <strong className="text-slate-200">{session.user.name}</strong>. Accessing isolated tenant records securely.
            </p>
          </div>

          {/* Quick Add action buttons utilizing Shadcn Primitives */}
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2 py-5 px-6 rounded-2xl text-xs font-semibold select-none shadow-lg shadow-violet-500/10">
            <PlusCircle className="w-4 h-4" />
            <span>Record New Thought</span>
          </Button>
        </div>

        {/* Bento Statistics Grid (Shadcn Cards + Tailwind Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 relative z-10">
          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-white shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Note Density</CardDescription>
              <CardTitle className="text-2xl font-display font-semibold text-white">{initialStats.totalNotes} nodes</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-white shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Unique Categories</CardDescription>
              <CardTitle className="text-2xl font-display font-semibold text-white">{initialStats.totalTags} tags</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-white shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Last Commit</CardDescription>
              <CardTitle className="text-lg font-display font-semibold text-slate-200 truncate mt-1">
                {initialNotes.length > 0 ? new Date(initialNotes[0].updatedAt).toLocaleDateString() : "Idle Space"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search systems (Shadcn Input) */}
        <div className="relative mb-6 z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Search through titles, ideas, or language scripts instantly..." 
            className="w-full bg-slate-900/30 border-slate-800/80 hover:border-slate-700/80 focus:border-violet-500 pl-12 pr-4 py-6 rounded-2xl text-slate-200 outline-none placeholder-slate-600 outline-none transition"
          />
        </div>

        {/* 
          DYNAMICS GRID:
          Client-side module wrapping the list of notes utilizing framer-motion transitions, search logic filters, 
          and sliders, rendering bento card modules.
        */}
        <NotesGrid 
          initialNotes={initialNotes} 
          currentUserId={session.user.id} 
        />
      </main>
    </div>
  );
}
