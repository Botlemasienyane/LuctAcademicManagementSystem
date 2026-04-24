import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(`Firebase config missing: ${missing.join(', ')}`);
  }
}

let authInstance;
let dbInstance;

export function getFirebaseApp() {
  assertFirebaseConfig();
  if (firebase.apps.length > 0) return firebase.app();
  return firebase.initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  authInstance = app.auth();
  return authInstance;
}

export function getFirebaseDb() {
  if (dbInstance) return dbInstance;
  dbInstance = getFirebaseApp().firestore();
  return dbInstance;
}
