import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export { doc, getDoc, serverTimestamp, setDoc };

export async function addDocToCollection(db, collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), data);
  return { id: ref.id };
}

export function updateDocFields(db, collectionName, id, data) {
  return setDoc(doc(db, collectionName, id), data, { merge: true });
}
