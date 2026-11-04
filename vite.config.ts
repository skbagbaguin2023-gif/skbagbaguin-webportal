import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import type { NextFunction } from 'connect';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import chatbot from './api/chatbot.ts';

function chatbotApiPlugin(): Plugin {
  return {
    name: 'chatbot-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (
        request: IncomingMessage,
        response: ServerResponse,
        next: NextFunction,
      ) => {
        if ((request.url ?? '').split('?')[0] !== '/api/chatbot') {
          next();
          return;
        }
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end();
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));

        let body: unknown;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ success: false, error: 'Invalid request.' }));
          return;
        }

        await chatbot(
          {
            method: request.method,
            body,
            headers: request.headers,
          },
          {
            status(code) {
              response.statusCode = code;
              return this;
            },
            json(value) {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(value));
            },
          },
        );
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY;
  if (env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL;
  if (env.ALLOWED_ORIGINS) process.env.ALLOWED_ORIGINS = env.ALLOWED_ORIGINS;

  return {
    plugins: [chatbotApiPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
