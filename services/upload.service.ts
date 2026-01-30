import { v4 as uuidv4 } from 'uuid';
import * as mm from 'music-metadata';
import axios from 'axios';
import { bucket } from '../config/database.js';
import { PassThrough, Readable } from 'stream';

export const uploadFile = async (file: Express.Multer.File | undefined, url: string | undefined, folder: string) => {
    let finalUrl = '';
    let duration = 0;
    let fileId = uuidv4();

    if (file) {
        // Parallelize upload and metadata extraction for buffers
        const uploadPromise = new Promise<void>((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(file.originalname, {
                metadata: { folder, uuid: fileId, contentType: file.mimetype }
            });

            // Capture the ID immediately
            finalUrl = uploadStream.id.toString();

            Readable.from(file.buffer).pipe(uploadStream)
                .on('error', reject)
                .on('finish', () => resolve());
        });

        const metadataPromise = (file.mimetype.startsWith('audio'))
            ? mm.parseBuffer(file.buffer).then(meta => {
                duration = Math.round((meta.format.duration || 0) * 1000);
            }).catch(err => {
                console.error('Error parsing metadata:', err);
            })
            : Promise.resolve();

        await Promise.all([uploadPromise, metadataPromise]);

    } else if (url && (url.startsWith('http') || url.includes('drive.google.com'))) {
        let downloadUrl = url;
        if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }

        try {
            // Use streaming for external URLs to avoid memory bottlenecks
            const response = await axios.get(downloadUrl, { responseType: 'stream' });
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            const filename = url.split('/').pop()?.split('?')[0] || 'downloaded_file';

            const uploadStream = bucket.openUploadStream(filename, {
                metadata: { folder, uuid: fileId, contentType: contentType }
            });
            finalUrl = uploadStream.id.toString();

            if (contentType.startsWith('audio')) {
                // We need to split the stream to both upload and parse metadata
                const uploadPassThrough = new PassThrough();
                const metadataPassThrough = new PassThrough();

                response.data.pipe(uploadPassThrough);
                response.data.pipe(metadataPassThrough);

                const uploadPromise = new Promise<void>((resolve, reject) => {
                    uploadPassThrough.pipe(uploadStream)
                        .on('error', reject)
                        .on('finish', resolve);
                });

                const metadataPromise = mm.parseStream(metadataPassThrough)
                    .then((meta: mm.IAudioMetadata) => {
                        duration = Math.round((meta.format.duration || 0) * 1000);
                    })
                    .catch((err: any) => console.error('Metadata parsing error:', err));

                await Promise.all([uploadPromise, metadataPromise]);
            } else {
                // Just pipe directly for non-audio (no metadata needed)
                await new Promise((resolve, reject) => {
                    response.data.pipe(uploadStream)
                        .on('error', reject)
                        .on('finish', resolve);
                });
            }
        } catch (error: any) {
            console.error("External URL download error:", error.message);
            finalUrl = url; // Fallback to original URL if download fails
        }
    }

    return { url: finalUrl, duration, publicId: fileId };
};

export const uploadToCloudinary = uploadFile;
