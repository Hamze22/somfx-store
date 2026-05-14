import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Configure Storage timeouts
storage.maxOperationRetryTime = 60000; // 60 seconds
storage.maxUploadRetryTime = 120000; // 120 seconds

// Validate connection on boot
async function testConnection() {
  try {
    // Attempting a fetch to a non-existent doc just to trigger network check
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: Client is offline or config is invalid.");
    }
    // Expected "not found" or "permission denied" is fine, means we connected
  }
}

testConnection();
