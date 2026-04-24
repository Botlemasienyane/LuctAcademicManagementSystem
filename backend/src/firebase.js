const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let app;

function readServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (jsonPath) {
    const fullPath = path.isAbsolute(jsonPath) ? jsonPath : path.join(process.cwd(), jsonPath);
    const file = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(file);
  }

  if (rawJson) {
    return JSON.parse(rawJson);
  }

  throw new Error(
    'Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT_PATH to the downloaded JSON file (recommended), or set FIREBASE_SERVICE_ACCOUNT_JSON.'
  );
}

function initFirebase() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = readServiceAccount();

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  });

  return app;
}

function getFirestore() {
  initFirebase();
  return admin.firestore();
}

async function verifyAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    initFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', detail: error.message });
  }
}

module.exports = { initFirebase, getFirestore, verifyAuth };
