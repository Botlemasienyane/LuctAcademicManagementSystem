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

export function deleteDocFromCollection(db, collectionName, id) {
  return db.collection(collectionName).doc(id).delete();
}

export function subscribeToCollection(db, collectionName, options = {}, onNext, onError) {
  let ref = db.collection(collectionName);

  if (options.orderByField) {
    ref = ref.orderBy(options.orderByField, options.orderDirection || 'desc');
  }

  if (options.limitCount) {
    ref = ref.limit(options.limitCount);
  }

  return ref.onSnapshot(
    snapshot => {
      const items = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      onNext(items);
    },
    onError
  );
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
