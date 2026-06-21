import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";
import { prepareProfilePhotoFile } from "../utils/imageUpload";

function getProfilePhotoPath(uid) {
  return `users/${uid}/profile/avatar.jpg`;
}

export async function uploadProfilePhoto(uid, file) {
  const preparedFile = await prepareProfilePhotoFile(file);
  const storagePath = getProfilePhotoPath(uid);
  const photoRef = ref(storage, storagePath);

  await uploadBytes(photoRef, preparedFile, {
    contentType: preparedFile.type,
    cacheControl: "public,max-age=3600",
  });

  const photoURL = await getDownloadURL(photoRef);
  return { photoURL, storagePath };
}

export async function removeProfilePhoto(uid) {
  try {
    await deleteObject(ref(storage, getProfilePhotoPath(uid)));
  } catch (error) {
    if (error?.code !== "storage/object-not-found") {
      throw error;
    }
  }
}
