// src/config/env.ts
// Central place for environment variable access.
// Throws at startup if a required server-side variable is missing.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.local.example to .env.local and fill in real values.`
    );
  }
  return value;
}

// ── Server-side only (not prefixed with NEXT_PUBLIC_) ──
export const serverEnv = {
  geminiApiKey: () => requireEnv("GEMINI_API_KEY"),
  firebaseAdminProjectId: () => requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
  firebaseAdminClientEmail: () => requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
  firebaseAdminPrivateKey: () =>
    requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
};

// ── Client-side (NEXT_PUBLIC_ – safe to expose in browser bundle) ──
export const clientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
};
