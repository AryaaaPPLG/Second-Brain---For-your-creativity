/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import { User, Note } from "./types";
import { getStoredNotes, saveStoredNotes, getStoredUsers, saveStoredUsers } from "./lib/store";
import { AnimatePresence } from "motion/react";

// Lazy load heavy components
const Editor = lazy(() => import("./components/Editor"));
const ProfileModal = lazy(() => import("./components/ProfileModal"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-[#09090b]">
      <div className="text-[#a1a1aa] text-sm">Loading...</div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Initialize storage and cache on launch
  useEffect(() => {
    setNotes(getStoredNotes());
  }, []);

  // Handle log ins
  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setSelectedTag(null); // Clear tag filters upon user context shifts
  }, []);

  // Handle log outs
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setSelectedTag(null);
    setIsEditorOpen(false);
    setIsProfileOpen(false);
  }, []);

  const handleUpdateProfile = useCallback((updatedProfile: User) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;

      const users = getStoredUsers();
      const duplicateEmail = users.some(
        (user) =>
          user.id !== prevUser.id &&
          user.email.toLowerCase() === updatedProfile.email.toLowerCase()
      );

      if (duplicateEmail) {
        alert("A profile with this email already exists.");
        return prevUser;
      }

      const nextProfile: User = {
        ...prevUser,
        ...updatedProfile,
        id: prevUser.id
      };

      const updatedUsers = users.map((user) =>
        user.id === prevUser.id ? nextProfile : user
      );

      saveStoredUsers(updatedUsers);
      setIsProfileOpen(false);
      return nextProfile;
    });
  }, []);

  const handleDeleteProfile = useCallback(() => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;

      const users = getStoredUsers().filter((user) => user.id !== prevUser.id);
      const remainingNotes = notes.filter((note) => note.userId !== prevUser.id);

      saveStoredUsers(users);
      saveStoredNotes(remainingNotes);
      setNotes(remainingNotes);
      setSelectedTag(null);
      setIsEditorOpen(false);
      setIsProfileOpen(false);
      return null;
    });
  }, [notes]);

  // Safe CRUD Actions conforming to User Level isolation
  const handleSaveNote = useCallback((noteData: Omit<Note, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;

      const timestamp = new Date().toISOString();
      let updatedNotes: Note[] = [];

      const existingIndex = notes.findIndex(n => n.id === noteData.id);

      if (existingIndex >= 0) {
        // Security Precaution Check: Confirm isolation
        if (notes[existingIndex].userId !== prevUser.id) {
          alert("Security Violation: You do not have permissions to modify this note record.");
          return prevUser;
        }

        // Update
        const updatedNote: Note = {
          ...notes[existingIndex],
          title: noteData.title,
          content: noteData.content,
          excerpt: noteData.excerpt,
          tags: noteData.tags,
          color: noteData.color,
          updatedAt: timestamp
        };
        
        updatedNotes = [...notes];
        updatedNotes[existingIndex] = updatedNote;
      } else {
        // Create new Note
        const newNote: Note = {
          id: noteData.id,
          title: noteData.title,
          content: noteData.content,
          excerpt: noteData.excerpt,
          tags: noteData.tags,
          color: noteData.color,
          createdAt: timestamp,
          updatedAt: timestamp,
          userId: prevUser.id
        };
        updatedNotes = [newNote, ...notes];
      }

      setNotes(updatedNotes);
      saveStoredNotes(updatedNotes);
      setIsEditorOpen(false);
      setEditingNote(null);
      return prevUser;
    });
  }, [notes]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return prevUser;

      const noteToDelete = notes.find(n => n.id === noteId);
      if (!noteToDelete) return prevUser;

      // Strict Tenant Isolation Verification
      if (noteToDelete.userId !== prevUser.id) {
        alert("Security Violation: You cannot delete a resource you do not own.");
        return prevUser;
      }

      const confirmCheck = confirm(`Are you sure you want to permanently expunge the note: "${noteToDelete.title}"?`);
      if (!confirmCheck) return prevUser;

      const remainingNotes = notes.filter(n => n.id !== noteId);
      setNotes(remainingNotes);
      saveStoredNotes(remainingNotes);
      return prevUser;
    });
  }, [notes]);

  const handleResetDatabase = useCallback(() => {
    const confirmation = confirm("This operation will reset the local browser instance back to the original seeded architecture notes for Alex and Sarah. Proceed?");
    if (!confirmation) return;

    localStorage.removeItem("secondbrain_notes");
    localStorage.removeItem("secondbrain_users");
    
    // Trigger direct state update
    getStoredUsers(); // Re-seeds users
    const seededNotes = getStoredNotes(); // Re-seeds notes
    setNotes(seededNotes);
    setSelectedTag(null);
    setIsEditorOpen(false);
    setEditingNote(null);
    setIsProfileOpen(false);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  }, []);

  const handleCreateNewNote = useCallback(() => {
    setEditingNote(null);
    setIsEditorOpen(true);
  }, []);

  return (
    <div id="workspace-root" className="min-h-screen bg-[#09090b] text-slate-100 font-sans flex overflow-hidden">
      {currentUser ? (
        <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
          {/* Dashboard Sidebar Navigation */}
          <Sidebar
            currentUser={currentUser}
            notes={notes}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            onLogout={handleLogout}
            onOpenProfile={() => setIsProfileOpen(true)}
            onResetDatabase={handleResetDatabase}
          />

          {/* Core Dashboard Stage */}
          <Dashboard
            currentUser={currentUser}
            notes={notes}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            onEditNote={handleEditNote}
            onCreateNote={handleCreateNewNote}
            onDeleteNote={handleDeleteNote}
          />

          {/* Sliding Editor Console */}
          <AnimatePresence>
            {isProfileOpen && currentUser && (
              <Suspense fallback={<LoadingFallback />}>
                <ProfileModal
                  currentUser={currentUser}
                  onClose={() => setIsProfileOpen(false)}
                  onUpdateProfile={handleUpdateProfile}
                  onDeleteProfile={handleDeleteProfile}
                />
              </Suspense>
            )}

            {isEditorOpen && (
              <Suspense fallback={<LoadingFallback />}>
                <Editor
                  note={editingNote}
                  userId={currentUser.id}
                  onSave={handleSaveNote}
                  onClose={() => {
                    setIsEditorOpen(false);
                    setEditingNote(null);
                  }}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <WelcomeScreen onLogin={handleLogin} />
      )}
    </div>
  );
}
