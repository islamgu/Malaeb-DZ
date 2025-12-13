import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { stadiumImages } from '../db/schema';
import { AuthRequest, authenticate, adminOnly } from '../middleware/auth';

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// POST /api/upload/stadium/:stadiumId - Upload images for a stadium
router.post(
    '/stadium/:stadiumId',
    authenticate,
    adminOnly,
    upload.array('images', 5),
    async (req: AuthRequest, res: Response) => {
        try {
            const { stadiumId } = req.params;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No images uploaded' });
            }

            // Get current max order for this stadium
            const existingImages = await db
                .select()
                .from(stadiumImages);

            const stadiumImageCount = existingImages.filter(img => img.stadiumId === stadiumId).length;
            let maxOrder = stadiumImageCount;

            // Insert image records
            const imageRecords = await Promise.all(
                files.map(async (file, index) => {
                    const [image] = await db
                        .insert(stadiumImages)
                        .values({
                            stadiumId,
                            url: `/uploads/${file.filename}`,
                            order: maxOrder + index,
                        })
                        .returning();
                    return image;
                })
            );

            res.status(201).json({
                message: `${files.length} images uploaded successfully`,
                images: imageRecords,
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload images' });
        }
    }
);

// For development, serve static files
// In production, use a CDN or cloud storage
export const setupStaticFiles = (app: any) => {
    app.use('/uploads', require('express').static('uploads'));
};

export default router;
