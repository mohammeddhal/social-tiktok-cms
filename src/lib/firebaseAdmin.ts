import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-adminsdk.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      console.log('Firebase service account file not found at:', serviceAccountPath);
    }
  } catch (error) {
    console.log('Firebase admin initialization error', error);
  }
}

export const messaging = getApps().length ? getMessaging(getApp()) : null;
