const PROFILE_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const PROFILE_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
const PROFILE_PHOTO_MAX_DIMENSION = 1024;
const PROFILE_PHOTO_OPTIMIZE_THRESHOLD = 1.2 * 1024 * 1024;

export function validateProfilePhotoFile(file) {
  if (!file) {
    return "Selecciona una imagen.";
  }

  if (!PROFILE_PHOTO_ALLOWED_TYPES.includes(file.type)) {
    return "Usa una imagen JPG, PNG o WEBP.";
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "La imagen supera el limite de 3 MB.";
  }

  return null;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    image.src = objectUrl;
  });
}

export async function prepareProfilePhotoFile(file) {
  const validationError = validateProfilePhotoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImageFromFile(file);
  const largestDimension = Math.max(image.width, image.height);
  const shouldOptimize =
    largestDimension > PROFILE_PHOTO_MAX_DIMENSION || file.size > PROFILE_PHOTO_OPTIMIZE_THRESHOLD;

  if (!shouldOptimize) {
    return file;
  }

  const scale = Math.min(1, PROFILE_PHOTO_MAX_DIMENSION / largestDimension);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la imagen.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("No se pudo optimizar la imagen."));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      0.88
    );
  });

  if (blob.size > PROFILE_PHOTO_MAX_BYTES) {
    throw new Error("La imagen optimizada sigue superando el limite permitido.");
  }

  return new File([blob], "profile-photo.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
