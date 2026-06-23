/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown or rich text string
  excerpt: string;
  tags: string[];
  color?: string; // Optional accent color (e.g., violet, emerald, amber)
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TagStats {
  name: string;
  count: number;
}

export interface SpaceStats {
  totalNotes: number;
  totalTags: number;
  recentActivityCount: number;
}
