import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-adminsdk.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.log('Firebase service account file not found at:', serviceAccountPath);
    }
  } catch (error) {
    console.log('Firebase admin initialization error', error);
  }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
