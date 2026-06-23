"use server";

import { auth, drive } from "@googleapis/drive";
import { Readable } from "node:stream";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/db";

type BackupFormat = "markdown" | "json";

type BackupResult =
  | {
      success: true;
      fileId: string;
      webViewLink: string | null;
    }
  | {
      success: false;
      error: string;
    };

const GOOGLE_TOKEN_EXPIRY_SKEW_SECONDS = 60;

const getAuthenticatedUserId = async (): Promise<string> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized.");
  }

  return session.user.id;
};

const escapeMarkdown = (value: string): string =>
  value.replaceAll("\r\n", "\n").trim();

const buildMarkdownBackup = (
  notes: Array<{
    title: string;
    content: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    tags: Array<{ name: string }>;
  }>,
): string => {
  const exportedAt = new Date().toISOString();
  const sections = notes.map((note) => {
    const tags = note.tags.map((tag) => tag.name).join(", ") || "none";

    return [
      `# ${escapeMarkdown(note.title)}`,
      "",
      `- Created: ${note.createdAt.toISOString()}`,
      `- Updated: ${note.updatedAt.toISOString()}`,
      `- Color: ${note.color}`,
      `- Tags: ${tags}`,
      "",
      escapeMarkdown(note.content),
    ].join("\n");
  });

  return [`# Second Brain Backup`, "", `Exported: ${exportedAt}`, "", "---", "", ...sections].join(
    "\n",
  );
};

const buildJsonBackup = (
  userId: string,
  notes: Array<{
    id: string;
    title: string;
    content: string;
    excerpt: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    tags: Array<{ name: string }>;
  }>,
): string =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      userId,
      notes: notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        tags: note.tags.map((tag) => tag.name),
      })),
    },
    null,
    2,
  );

const getGoogleAccessToken = async (userId: string): Promise<string> => {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      id: true,
      access_token: true,
      expires_at: true,
      refresh_token: true,
      scope: true,
    },
  });

  if (!account?.access_token) {
    throw new Error("Google account is not connected. Sign in with Google again.");
  }

  if (!account.scope?.includes("https://www.googleapis.com/auth/drive.file")) {
    throw new Error("Google Drive backup permission is missing. Sign in with Google again.");
  }

  const expiresAt = account.expires_at ?? 0;
  const expiresSoon = expiresAt <= Math.floor(Date.now() / 1000) + GOOGLE_TOKEN_EXPIRY_SKEW_SECONDS;

  if (!expiresSoon) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("Google access expired. Sign in with Google again to refresh Drive access.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to refresh Google Drive access. Sign in with Google again.");
  }

  const tokenResponse = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
  };

  if (!tokenResponse.access_token) {
    throw new Error("Google did not return a refreshed access token.");
  }

  await prisma.account.update({
    where: {
      id: account.id,
    },
    data: {
      access_token: tokenResponse.access_token,
      expires_at: tokenResponse.expires_in
        ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
        : account.expires_at,
      refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope ?? account.scope,
    },
  });

  return tokenResponse.access_token;
};

export async function backupNotesToGoogleDrive(
  format: BackupFormat = "markdown",
): Promise<BackupResult> {
  try {
    if (format !== "markdown" && format !== "json") {
      throw new Error("Unsupported backup format.");
    }

    const userId = await getAuthenticatedUserId();

    const [notes, accessToken] = await Promise.all([
      prisma.note.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          tags: {
            select: {
              name: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      }),
      getGoogleAccessToken(userId),
    ]);

    const now = new Date().toISOString().replaceAll(":", "-");
    const isMarkdown = format === "markdown";
    const fileName = `second-brain-backup-${now}.${isMarkdown ? "md" : "json"}`;
    const mimeType = isMarkdown ? "text/markdown" : "application/json";
    const body = isMarkdown ? buildMarkdownBackup(notes) : buildJsonBackup(userId, notes);

    const oauth2Client = new auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const driveClient = drive({
      version: "v3",
      auth: oauth2Client,
    });

    const upload = await driveClient.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        description: "Second Brain notes backup generated by the app.",
      },
      media: {
        mimeType,
        body: Readable.from([body]),
      },
      fields: "id, webViewLink",
    });

    if (!upload.data.id) {
      throw new Error("Google Drive upload completed without returning a file id.");
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      fileId: upload.data.id,
      webViewLink: upload.data.webViewLink ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload backup.",
    };
  }
}
