import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export function doc(db, collectionName, id) {
  return db.collection(collectionName).doc(id);
}

export async function getDoc(ref) {
  const snap = await ref.get();
  return {
    exists: () => snap.exists,
    data: () => snap.data(),
  };
}

export function setDoc(ref, data, options) {
  return ref.set(data, options);
}

export async function addDocToCollection(db, collectionName, data) {
  const ref = await db.collection(collectionName).add(data);
  return { id: ref.id };
}

export function updateDocFields(db, collectionName, id, data) {
  return db.collection(collectionName).doc(id).set(data, { merge: true });
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
