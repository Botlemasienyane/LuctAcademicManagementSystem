import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export { doc, getDoc, serverTimestamp, setDoc };

export async function addDocToCollection(db, collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), data);
  return { id: ref.id };
}

export function updateDocFields(db, collectionName, id, data) {
  return setDoc(doc(db, collectionName, id), data, { merge: true });
}

export function deleteDocFromCollection(db, collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export function subscribeToCollection(db, collectionName, options = {}, onNext, onError) {
  const constraints = [];

  if (options.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
  }

  if (options.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const ref = constraints.length > 0 ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
  return onSnapshot(
    ref,
    snapshot => {
      const items = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      onNext(items);
    },
    onError
  );
}
