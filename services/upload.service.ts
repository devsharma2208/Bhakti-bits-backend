import cloudinary from '../config/cloudinary.js';
import * as mm from 'music-metadata';

export const uploadToCloudinary = async (file: Express.Multer.File | undefined, url: string | undefined, folder: string) => {
    let finalUrl = '';
    let duration = 0;
    let publicId = '';

    if (file) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = "data:" + file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: folder
        });
        finalUrl = result.secure_url;
        publicId = result.public_id;

        if (file.mimetype.startsWith('audio') || result.resource_type === 'video') {
            try {
                const metadata = await mm.parseBuffer(file.buffer);
                duration = Math.round((metadata.format.duration || 0) * 1000);
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
