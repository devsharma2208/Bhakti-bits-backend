import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from './env.js';

// Only configure cloudinary if credentials are provided
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    try {
        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET
        });
        console.log('Cloudinary configured successfully');
    } catch (error) {
        console.warn('Warning: Failed to configure Cloudinary:', error);
    }
} else {
    console.warn('Warning: Cloudinary credentials not provided. File uploads will fail.');
}

export default cloudinary;
