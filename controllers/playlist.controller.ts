import { Request, Response } from "express";
import playlistService from "../services/playlist.service.js";
import { v4 as uuidv4 } from "uuid"; // for generating unique IDs

/* -------------------- READ -------------------- */

// GET /playlist
export const getPlaylist = async (req: Request, res: Response) => {
    try {
        const ifNoneMatch = req.headers["if-none-match"];
        const { body, etag } = await playlistService.getPlaylist();

        if (ifNoneMatch && ifNoneMatch === etag) {
            return res.status(304).end();
        }

        res.setHeader("Content-Type", "application/json");
        res.setHeader("ETag", etag as string);
        res.status(200).json(body);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /stats
export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await playlistService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /playlist/categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const result = await playlistService.getCategories(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /playlist/categories/:id
export const getCategory = async (req: Request, res: Response) => {
    try {
        const category = await playlistService.getCategory(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /playlist/categories/:id/tracks
export const getTracksByCategory = async (req: Request, res: Response) => {
    try {
        const tracks = await playlistService.getTracksByCategory(req.params.id);
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /playlist/tracks
export const getTracks = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const categoryId = req.query.categoryId as string;
        const search = req.query.search as string;

        const result = await playlistService.getTracks(page, limit, categoryId, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

import { uploadToCloudinary } from "../services/upload.service.js";

/* -------------------- CREATE -------------------- */

export const createCategory = async (req: Request, res: Response) => {
    try {
        let artworkUrl = req.body.artworkUrl || "";

        // Handle file upload if present
        if (req.file) {
            const upload = await uploadToCloudinary(req.file, undefined, 'bhakti-bits/categories');
            artworkUrl = upload.url;
        } else if (artworkUrl && artworkUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, artworkUrl, 'bhakti-bits/categories');
            artworkUrl = upload.url;
        }

        const categoryData = {
            id: uuidv4(),
            name: req.body.name || "Untitled Category",
            description: req.body.description || "",
            artworkUrl: artworkUrl,
            trackCount: parseInt(req.body.trackCount) || 0,
        };

        const category = await playlistService.addCategory(categoryData);
        res.status(201).json(category);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Failed to create category" });
    }
};

export const createTrack = async (req: Request, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let artworkUrl = req.body.artworkUrl || "";
        let audioUrl = req.body.audioUrl || "";
        let durationMs = parseInt(req.body.durationMs) || 0;

        // Upload Artwork if file or GDrive URL
        if (files?.artwork?.[0]) {
            const upload = await uploadToCloudinary(files.artwork[0], undefined, 'bhakti-bits/artworks');
            artworkUrl = upload.url;
        } else if (artworkUrl && (artworkUrl.includes('drive.google.com') || artworkUrl.includes('res.cloudinary.com'))) {
            const upload = await uploadToCloudinary(undefined, artworkUrl, 'bhakti-bits/artworks');
            artworkUrl = upload.url;
        }

        // Upload Audio if file or GDrive URL
        if (files?.audio?.[0]) {
            const upload = await uploadToCloudinary(files.audio[0], undefined, 'bhakti-bits/tracks');
            audioUrl = upload.url;
            durationMs = upload.duration;
        } else if (audioUrl && (audioUrl.includes('drive.google.com') || audioUrl.includes('res.cloudinary.com'))) {
            const upload = await uploadToCloudinary(undefined, audioUrl, 'bhakti-bits/tracks');
            audioUrl = upload.url;
            durationMs = upload.duration;
        }

        const trackData = {
            ...req.body,
            id: req.body.id || uuidv4(),
            artworkUrl,
            audioUrl,
            durationMs,
            updatedAt: new Date().toISOString(),
        };

        const track = await playlistService.addTrack(trackData);
        res.status(201).json(track);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Failed to create track" });
    }
};

/* -------------------- UPDATE -------------------- */

// PUT /playlist/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
    try {
        let updateData = { ...req.body };

        if (req.file) {
            const upload = await uploadToCloudinary(req.file, undefined, 'bhakti-bits/categories');
            updateData.artworkUrl = upload.url;
        } else if (updateData.artworkUrl && updateData.artworkUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, updateData.artworkUrl, 'bhakti-bits/categories');
            updateData.artworkUrl = upload.url;
        }

        const updated = await playlistService.updateCategory(
            req.params.id,
            updateData
        );
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Category not found" });
    }
};

// PUT /playlist/tracks/:id
export const updateTrack = async (req: Request, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let updateData = { ...req.body };

        if (files?.artwork?.[0]) {
            const upload = await uploadToCloudinary(files.artwork[0], undefined, 'bhakti-bits/artworks');
            updateData.artworkUrl = upload.url;
        } else if (updateData.artworkUrl && updateData.artworkUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, updateData.artworkUrl, 'bhakti-bits/artworks');
            updateData.artworkUrl = upload.url;
        }

        if (files?.audio?.[0]) {
            const upload = await uploadToCloudinary(files.audio[0], undefined, 'bhakti-bits/tracks');
            updateData.audioUrl = upload.url;
            updateData.durationMs = upload.duration;
        } else if (updateData.audioUrl && updateData.audioUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, updateData.audioUrl, 'bhakti-bits/tracks');
            updateData.audioUrl = upload.url;
            updateData.durationMs = upload.duration;
        }

        const updated = await playlistService.updateTrack(
            req.params.id,
            updateData
        );
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Track not found" });
    }
};

/* -------------------- DELETE -------------------- */

// DELETE /playlist/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        await playlistService.deleteCategory(req.params.id);
        res.status(204).end();
    } catch {
        res.status(404).json({ message: "Category not found" });
    }
};

// DELETE /playlist/tracks/:id
export const deleteTrack = async (req: Request, res: Response) => {
    try {
        await playlistService.deleteTrack(req.params.id);
        res.status(204).end();
    } catch {
        res.status(404).json({ message: "Track not found" });
    }
};
