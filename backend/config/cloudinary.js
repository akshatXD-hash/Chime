import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer or base64 string / file path to Cloudinary.
 * @param {Buffer|string} fileSource - Buffer, base64 data URI, or file path.
 * @param {string} folder - Target folder in Cloudinary.
 * @returns {Promise<Object>} - Resolves with Cloudinary upload result object.
 */
export const uploadToCloudinary = (fileSource, folder = "chime/avatars") => {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(fileSource)) {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(fileSource);
    } else {
      cloudinary.uploader.upload(
        fileSource,
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    }
  });
};

export default cloudinary;
