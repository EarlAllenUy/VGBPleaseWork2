import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (one level up from config/)
dotenv.config({ path: join(__dirname, '../.env') });

// Verify required environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not defined in .env file');
}

if (!process.env.FIREBASE_DATABASE_URL) {
  throw new Error('FIREBASE_DATABASE_URL is not defined in .env file');
}

// Resolve the service account path relative to backend root
const serviceAccountPath = join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  throw new Error(`Failed to read service account file at ${serviceAccountPath}: ${error.message}`);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
});

console.log('✅ Firebase initialized successfully');

// Export Firebase services
export const db = admin.database();
export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;