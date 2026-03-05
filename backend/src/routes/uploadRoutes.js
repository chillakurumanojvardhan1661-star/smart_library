import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';

const router = express.Router();

// Configure multer to use memory storage (we don't want to save to the local disk before uploading)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate a unique filename to prevent collisions
        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFilename = `book-covers/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

        // Upload to Vercel Blob
        const blob = await put(uniqueFilename, req.file.buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            contentType: req.file.mimetype,
        });

        // Return the public URL
        res.status(200).json({
            url: blob.url,
            pathname: blob.pathname,
        });

    } catch (error) {
        console.error('Blob Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload to Vercel Blob.' });
    }
});

export default router;
