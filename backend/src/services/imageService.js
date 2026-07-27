import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";
import { logger } from "../utils/logger.js";

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "urbanlog/incidents", resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

// Recibe los archivos de multer (memoryStorage) y devuelve las URLs subidas.
// Si Cloudinary no está configurado, no rompe la creación del incidente: solo
// no adjunta imágenes.
export async function uploadIncidentImages(files = []) {
  if (files.length === 0) return [];

  if (!cloudinaryConfigured) {
    logger.warn("Cloudinary no configurado, se omiten las imágenes subidas");
    return [];
  }

  try {
    return await Promise.all(files.map((file) => uploadBuffer(file.buffer)));
  } catch (err) {
    logger.error("Error subiendo imágenes a Cloudinary:", err.message);
    return [];
  }
}
