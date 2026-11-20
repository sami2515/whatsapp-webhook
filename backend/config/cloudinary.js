import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Support both individual env vars and full CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

export const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
};

/**
 * Uploads a file (either buffer or file path) to Cloudinary.
 * If Cloudinary is not yet configured, falls back to local uploads/ directory.
 */
export const uploadImageToCloudinary = async (file, folder = 'whatsapp_messages') => {
    if (!file) return null;

    // 1. If Cloudinary is configured, upload to Cloudinary
    if (isCloudinaryConfigured()) {
        try {
            if (file.path) {
                // Upload from disk path
                const result = await cloudinary.uploader.upload(file.path, {
                    folder,
                    resource_type: 'auto'
                });
                // Clean up local temp file if created by multer
                try { fs.unlinkSync(file.path); } catch (_) {}
                return {
                    url: result.secure_url,
                    publicId: result.public_id
                };
            } else if (file.buffer) {
                // Upload from memory buffer
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder, resource_type: 'auto' },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id
                            });
                        }
                    );
                    stream.end(file.buffer);
                });
            }
        } catch (err) {
            console.error('[Cloudinary Upload Error]', err);
            // If upload fails, fall through to local fallback
        }
    }

    // 2. Fallback: Save locally if file on disk, return relative URL
    console.warn('[Storage] Cloudinary not configured or failed, using local file storage.');
    if (file.path) {
        const filename = path.basename(file.path);
        return {
            url: `/uploads/${filename}`,
            publicId: filename
        };
    }

    return null;
};

export default cloudinary;
