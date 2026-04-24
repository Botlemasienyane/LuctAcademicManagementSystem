require('dotenv').config();

const admin = require('firebase-admin');
const { initFirebase, getFirestore } = require('../firebase');
const demoUsers = require('../seed/demoUsers');

async function upsertAuthUser(user) {
  const email = user.email.toLowerCase().trim();
  try {
    const existing = await admin.auth().getUserByEmail(email);
    // Update the saved name if the account already exists.
    await admin.auth().updateUser(existing.uid, { displayName: user.name });
    return existing.uid;
  } catch (e) {
    if (String(e?.code || '').includes('auth/user-not-found')) {
      const created = await admin.auth().createUser({
        email,
        password: user.password,
        displayName: user.name,
        emailVerified: true,
      });
      return created.uid;
    }
    throw e;
  }
}

async function upsertProfile(uid, user) {
  const db = getFirestore();
  const profile = { ...user };
  delete profile.password;
  profile.email = user.email.toLowerCase().trim();
  profile.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  profile.createdAt = profile.createdAt || admin.firestore.FieldValue.serverTimestamp();

  await db.collection('users').doc(uid).set(profile, { merge: true });
}

async function run() {
  initFirebase();
  console.log(`Seeding ${demoUsers.length} users...`);

  for (const u of demoUsers) {
    const uid = await upsertAuthUser(u);
    await upsertProfile(uid, u);
    console.log(`OK: ${u.role} ${u.email} -> uid=${uid}`);
  }

  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
