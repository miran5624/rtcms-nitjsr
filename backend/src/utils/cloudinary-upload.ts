import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary.js';

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = 'complaints'
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve({ secure_url: result.secure_url });
        else reject(new Error('Upload returned no result'));
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}
