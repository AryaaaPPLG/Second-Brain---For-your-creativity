"use server";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route"; // Session Options location
import { prisma } from "@/src/lib/db"; // Prisma database client instance

// Security Helper: Fetches session and returns authenticated userId or throws a strict error
async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Active user coordinates are missing. Access revoked.");
  }
  
  return session.user.id;
}

export interface NoteInput {
  title: string;
  content: string;
  color?: string;
  tags: string[]; // List of tag string labels
}

/**
 * SECURE ACTION: Fetches notes for the logged-in user only (Direct IDOR Prevention)
 */
export async function getNotes(selectedTag?: string | null) {
  try {
    const userId = await getAuthenticatedUserId();

    const notes = await prisma.note.findMany({
      where: {
        userId: userId, // IDOR Safe: Strict tenant constraint
        ...(selectedTag ? {
          tags: {
            some: {
              name: {
                equals: selectedTag.toLowerCase().trim(),
                mode: "insensitive"
              }
            }
          }
        } : {})
      },
      include: {
        tags: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return { success: true, data: notes };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to query notes index." };
  }
}

/**
 * SECURE ACTION: Create a new Note node connected to the active tenant safely
 */
export async function createNote(input: NoteInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const { title, content, color, tags } = input;

    if (!title.trim()) {
      throw new Error("Validation Error: Note title must not be empty.");
    }

    // Generate neat summary description from content
    const excerpt = content
      .replace(/[#*`>_\-]/g, "")
      .substring(0, 140)
      .trim() + (content.length > 140 ? "..." : "");

    // Prepare tags list connectOrCreate query blocks
    const tagQueries = tags.map((name) => {
      const normalizedName = name.toLowerCase().trim();
      return {
        where: { name: normalizedName },
        create: { name: normalizedName }
      };
    });

    const newNote = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content,
        excerpt: excerpt || "No description provided.",
        color: color || "violet",
        userId: userId, // IDOR Safe: Forced coupling to session
        tags: {
          connectOrCreate: tagQueries
        }
      },
      include: {
        tags: true
      }
    });

    revalidatePath("/dashboard");
    return { success: true, data: newNote };
  } catch (error: any) {
    return { success: false, error: error.message || "Could not instantiate note node." };
  }
}

/**
 * SECURE ACTION: Updates an existing note securely
 */
export async function updateNote(noteId: string, input: Partial<NoteInput>) {
  try {
    const userId = await getAuthenticatedUserId();
    const { title, content, color, tags } = input;

    // Direct IDOR & Ownership Verification Check:
    // We restrict query by BOTH noteId AND userId. Next.js server prevents any unassigned manipulation.
    const noteExists = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: userId // Strict ownership limit check
      }
    });

    if (!noteExists) {
      throw new Error("Access Revoked: Resource entity not found, or you lack edit rights.");
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) {
      updateData.content = content;
      updateData.excerpt = content
        .replace(/[#*`>_\-]/g, "")
        .substring(0, 140)
        .trim() + (content.length > 140 ? "..." : "");
    }
    if (color !== undefined) updateData.color = color;

    // Handle tag connections and disconnections
    if (tags !== undefined) {
      const tagQueries = tags.map((name) => {
        const normalizedName = name.toLowerCase().trim();
        return {
          where: { name: normalizedName },
          create: { name: normalizedName }
        };
      });

      // Clear previous connections and establish fresh links
      updateData.tags = {
        set: [], // Resets previous relationships
        connectOrCreate: tagQueries
      };
    }

    const updatedNote = await prisma.note.update({
      where: {
        id: noteId // Enforced safe update because of prior security query check
      },
      data: updateData,
      include: {
        tags: true
      }
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedNote };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update note record safely." };
  }
}

/**
 * SECURE ACTION: Expunges note from database with strict ownership check
 */
export async function deleteNote(noteId: string) {
  try {
    const userId = await getAuthenticatedUserId();

    // IDOR Protection: Query for note belonging exclusively to the authenticated session user
    const noteToDelete = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: userId
      }
    });

    if (!noteToDelete) {
      throw new Error("Authorization Denied: Target element does not exist or you do not own it.");
    }

    await prisma.note.delete({
      where: {
        id: noteId
      }
    });

    revalidatePath("/dashboard");
    return { success: true, message: "Resource successfully removed from persistent index." };
  } catch (error: any) {
    return { success: false, error: error.message || "Expunge request failed." };
  }
}

/**
 * SECURE ACTION: Compiles user statistics dynamically safely
 */
export async function getDashboardStats() {
  try {
    const userId = await getAuthenticatedUserId();

    const [notesCount, userTags] = await Promise.all([
      prisma.note.count({
        where: { userId }
      }),
      prisma.tag.findMany({
        where: {
          notes: {
            some: {
              userId: userId
            }
          }
        },
        select: {
          name: true,
          _count: {
            select: { notes: true }
          }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalNotes: notesCount,
        totalTags: userTags.length,
        tagsBreakdown: userTags.map(t => ({ name: t.name, count: t._count.notes }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to aggregate dashboard metadata." };
  }
}
