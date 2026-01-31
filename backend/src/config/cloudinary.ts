import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';

console.log('[Cloudinary Config] Current CWD:', process.cwd());
console.log('[Cloudinary Config] Environment check - CLOUD_NAME:', process.env.CLOUD_NAME ? 'Present' : 'Missing');

if (!process.env.CLOUD_NAME) {
  console.log('[Cloudinary Config] Attempting to load .env manually...');
  const paths = ['.env', '../.env', '../../.env'];
  for (const p of paths) {
    const envPath = path.resolve(process.cwd(), p);
    console.log(`[Cloudinary Config] Checking ${envPath}`);
    const result = dotenv.config({ path: envPath });
    if (result.parsed?.CLOUD_NAME) {
      console.log(`[Cloudinary Config] Loaded CLOUD_NAME from ${envPath}`);
      break;
    }
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export { cloudinary };
