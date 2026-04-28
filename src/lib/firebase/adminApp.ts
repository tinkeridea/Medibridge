// src/lib/firebase/adminApp.ts
// Firebase Admin SDK – server-side only. Used in API routes to verify
// ID tokens and write to Firestore with elevated privileges.

import * as admin from "firebase-admin";
import { serverEnv } from "@/config/env";

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serverEnv.firebaseAdminProjectId(),
      clientEmail: serverEnv.firebaseAdminClientEmail(),
      privateKey: serverEnv.firebaseAdminPrivateKey(),
    }),
  });
}

const adminApp = initAdmin();
const adminDb = admin.firestore(adminApp);
const adminAuth = admin.auth(adminApp);

export { adminApp, adminDb, adminAuth };
