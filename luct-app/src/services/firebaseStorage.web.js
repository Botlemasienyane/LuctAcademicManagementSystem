import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from './firebaseClient';

const blobFromUri = async (uri) => {
  const response = await fetch(uri);
  return response.blob();
};

export async function uploadOutlineDocument({ file, outlineId }) {
  const storage = getFirebaseStorage();
  const extension = (file.name?.split('.').pop() || 'pdf').toLowerCase();
  const storagePath = `course-outlines/${outlineId}/${Date.now()}_${file.name || `outline.${extension}`}`;
  const storageRef = ref(storage, storagePath);
  const source = file.file || await blobFromUri(file.uri);

  await uploadBytes(storageRef, source, {
    contentType: file.mimeType || 'application/octet-stream',
  });

  const downloadUrl = await getDownloadURL(storageRef);

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
  await deleteObject(ref(storage, storagePath));
}
