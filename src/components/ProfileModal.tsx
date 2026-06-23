/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, Mail, Save, Trash2, User as UserIcon, X } from "lucide-react";
import { User } from "../types";

interface ProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (profile: User) => void;
  onDeleteProfile: () => void;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80";

export default function ProfileModal({
  currentUser,
  onClose,
  onUpdateProfile,
  onDeleteProfile
}: ProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [headline, setHeadline] = useState(currentUser.headline || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || FALLBACK_AVATAR);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setHeadline(currentUser.headline || "");
    setBio(currentUser.bio || "");
    setAvatarUrl(currentUser.avatarUrl || FALLBACK_AVATAR);
    setError("");
  }, [currentUser]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile picture must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please use a valid email address.");
      return;
    }

    onUpdateProfile({
      ...currentUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      headline: headline.trim(),
      bio: bio.trim(),
      avatarUrl
    });
  };

  const handleDelete = () => {
    const confirmed = confirm(
      "Delete this profile and all notes owned by this user? This cannot be undone."
    );

    if (confirmed) {
      onDeleteProfile();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-xl bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]/40">
          <div>
            <h2 className="font-display text-sm font-semibold text-white">Profile Settings</h2>
            <p className="text-[11px] text-[#71717a] mt-0.5">Manage your account identity and profile picture.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition cursor-pointer"
            title="Close profile settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex flex-col items-center gap-3">
              <img
                src={avatarUrl}
                alt={name || currentUser.name}
                className="w-28 h-28 rounded-lg object-cover border border-[#27272a] bg-[#09090b]"
                referrerPolicy="no-referrer"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-semibold text-[#d4d4d8] hover:text-white hover:border-blue-500/40 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-10 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-10 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="e.g. Product Engineer"
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 px-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Write a short profile bio..."
              className="w-full min-h-24 bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg p-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none resize-none transition"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-950/20 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Profile</span>
            </button>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-white hover:bg-[#fafafa] text-black px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
