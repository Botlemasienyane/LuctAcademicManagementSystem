import { getFirebaseStorage } from './firebaseClient';

const blobFromUri = (uri) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Could not read the selected document.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

export async function uploadOutlineDocument({ file, outlineId }) {
  const storage = getFirebaseStorage();
  const extension = (file.name?.split('.').pop() || 'pdf').toLowerCase();
  const storagePath = `course-outlines/${outlineId}/${Date.now()}_${file.name || `outline.${extension}`}`;
  const blob = await blobFromUri(file.uri);
  const ref = storage.ref(storagePath);

  await ref.put(blob, {
    contentType: file.mimeType || 'application/octet-stream',
  });

  if (typeof blob.close === 'function') {
    blob.close();
  }

  const downloadUrl = await ref.getDownloadURL();

  return {
    attachmentName: file.name || `outline.${extension}`,
    attachmentUrl: downloadUrl,
    storagePath,
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size || 0,
  };
}

export async function deleteOutlineDocument(storagePath) {
  if (!storagePath) return;
  const storage = getFirebaseStorage();
  await storage.ref(storagePath).delete();
}

export async function uploadUserProfilePhoto({ file, uid }) {
  const storage = getFirebaseStorage();
  const extension = (file.fileName?.split('.').pop() || file.name?.split('.').pop() || 'jpg').toLowerCase();
  const filename = file.fileName || file.name || `profile.${extension}`;
  const storagePath = `profile-photos/${uid}/${Date.now()}_${filename}`;
  const blob = await blobFromUri(file.uri);
  const ref = storage.ref(storagePath);

  await ref.put(blob, {
    contentType: file.mimeType || file.type || 'image/jpeg',
  });

  if (typeof blob.close === 'function') {
    blob.close();
  }

  return {
    storagePath,
    downloadUrl: await ref.getDownloadURL(),
  };
}

export async function deleteUserProfilePhoto(storagePath) {
  if (!storagePath) return;
  const storage = getFirebaseStorage();
  await storage.ref(storagePath).delete();
}
