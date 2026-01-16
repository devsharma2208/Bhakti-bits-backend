import cloudinary from '../config/cloudinary.js';
import * as mm from 'music-metadata';
import { Readable } from 'stream';

export const uploadToCloudinary = async (file: Express.Multer.File | undefined, url: string | undefined, folder: string) => {
    let finalUrl = '';
    let duration = 0;
    let publicId = '';

    if (file) {
        // Use upload_stream for better memory handling with large files
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: folder
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            const fileStream = Readable.from(file.buffer);
            fileStream.pipe(uploadStream);
        });

        finalUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;

        // Extract duration for audio/video files
        // Note: For stream uploads, we still rely on the buffer for metadata extraction
        // which implies the file is in memory (due to multer memoryStorage).
        // Cloudinary also returns duration for video/audio resources.
        if (file.mimetype.startsWith('audio') || uploadResult.resource_type === 'video') {
            try {
                // Try getting duration from Cloudinary first
                if (uploadResult.duration) {
                    duration = Math.round(uploadResult.duration * 1000);
                } else {
                    // Fallback to music-metadata
                    const metadata = await mm.parseBuffer(file.buffer);
                    duration = Math.round((metadata.format.duration || 0) * 1000);
                }
            } catch (err) {
                console.error('Error parsing metadata:', err);
            }
        }
    } else if (url && (url.startsWith('http') || url.includes('drive.google.com'))) {
        let uploadUrl = url;
        if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                uploadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }

        const result = await cloudinary.uploader.upload(uploadUrl, {
            resource_type: 'auto',
            folder: folder
        });
        finalUrl = result.secure_url;
        publicId = result.public_id;
        duration = Math.round((result.duration || 0) * 1000);
    }

    return { url: finalUrl, duration, publicId };
};
