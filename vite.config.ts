import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import { assistNoteWithGemini, type GeminiNoteAssistRequest } from './server/gemini';

function geminiApiPlugin(apiKey?: string): Plugin {
  return {
    name: 'second-brain-gemini-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini/note-assist', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];

          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }

          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as GeminiNoteAssistRequest;
          const result = await assistNoteWithGemini(body, apiKey);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: getApiErrorMessage(error)
          }));
        }
      });
    },
  };
}

function getApiErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Gemini request failed.';
  }

  try {
    const parsed = JSON.parse(error.message) as { error?: { message?: string } };
    return parsed.error?.message || error.message;
  } catch {
    return error.message;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin(geminiApiKey)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },    build: {
      // Enable minification for smaller bundle
      minify: 'esbuild',
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react': ['react', 'react-dom'],
            'motion': ['motion/react'],
            'lucide': ['lucide-react'],
            'ui-libs': ['@prisma/client', '@next-auth/prisma-adapter', 'next-auth'],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Better tree-shaking and code splitting
      target: 'ES2022',
      // CSS code splitting
      cssCodeSplit: true,
    },  };
});
