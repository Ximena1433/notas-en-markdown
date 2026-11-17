import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error("FIREBASE_PRIVATE_KEY no está configurada");
  }
  return key.replace(/\\n/g, "\n");
}

let app: App | undefined;

export function getFirebaseApp(): App {
  if (app) {
    return app;
  }

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    throw new Error("Configuración de Firebase incompleta");
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: getPrivateKey(),
    }),
  });

  return app;
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export const NOTES_COLLECTION = "notes";
