import { Request, Response } from "express";
import playlistService from "../services/playlist.service.js";
import { v4 as uuidv4 } from "uuid";

const autoTimestampLRC = (transcript: any[], durationMs: number): any[] => {
    if (!transcript || !Array.isArray(transcript)) return [];

    return transcript.map(node => {
        if (node.type === 'lrc' && durationMs > 0) {
            const hasTimestamps = node.content.split('\n').some((line: string) => /\[\d+:\d+(?:\.\d+)?\]/.test(line));
            if (!hasTimestamps) {
                const lines = node.content.split('\n').filter((l: string) => l.trim() !== '');
                const effectiveMs = durationMs * 0.95; // 5% buffer
                const interval = effectiveMs / lines.length;

                node.content = lines.map((line: string, i: number) => {
                    const timeMs = i * interval;
                    const mins = Math.floor(timeMs / 60000);
                    const secs = ((timeMs % 60000) / 1000).toFixed(2).padStart(5, '0');
                    return `[${mins.toString().padStart(2, '0')}:${secs}] ${line.trim()}`;
                }).join('\n');
            }
        }
        return node;
    });
};


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
    } catch (error: any) {
        console.error("Error getting playlist:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

// GET /stats
export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await playlistService.getStats();
        res.json(stats);
    } catch (error: any) {
        console.error("Error getting stats:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

// GET /playlist/categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
        const search = req.query.search as string;

        const result = await playlistService.getCategories(page, limit, search);
        res.json(result);
    } catch (error: any) {
        console.error("Error getting categories:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

// GET /playlist/categories/:id
export const getCategory = async (req: Request, res: Response) => {
    try {
        if (!req.params.id || req.params.id.trim() === "") {
            return res.status(400).json({ message: "Category ID is required" });
        }

        const category = await playlistService.getCategory(req.params.id.trim());
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
    } catch (error: any) {
        console.error("Error getting category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

// GET /playlist/categories/:id/tracks
export const getTracksByCategory = async (req: Request, res: Response) => {
    try {
        if (!req.params.id || req.params.id.trim() === "") {
            return res.status(400).json({ message: "Category ID is required" });
        }

        // Verify category exists
        const category = await playlistService.getCategory(req.params.id.trim());
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const tracks = await playlistService.getTracksByCategory(req.params.id.trim());
        res.json(tracks);
    } catch (error: any) {
        console.error("Error getting tracks by category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

// GET /playlist/tracks
export const getTracks = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
        const categoryId = req.query.categoryId as string;
        const search = req.query.search as string;

        // Validate categoryId if provided
        if (categoryId && categoryId !== "all") {
            const category = await playlistService.getCategory(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
        }

        const result = await playlistService.getTracks(page, limit, categoryId, search);
        res.json(result);
    } catch (error: any) {
        console.error("Error getting tracks:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "Unknown error"
        });
    }
};

import { uploadToCloudinary } from "../services/upload.service.js";

/* -------------------- CREATE -------------------- */

export const createCategory = async (req: Request, res: Response) => {
    try {
        // Validate required fields
        if (!req.body.name || req.body.name.trim() === "") {
            return res.status(400).json({ message: "Category name is required" });
        }

        if (!req.body.description || req.body.description.trim() === "") {
            return res.status(400).json({ message: "Category description is required" });
        }

        let artworkUrl = req.body.artworkUrl || "";

        // Handle file upload if present
        if (req.file) {
            const upload = await uploadToCloudinary(req.file, undefined, 'bhakti-bits/categories');
            artworkUrl = upload.url;
        } else if (artworkUrl && artworkUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, artworkUrl, 'bhakti-bits/categories');
            artworkUrl = upload.url;
        }

        // Validate artworkUrl is provided (either via file upload or URL)
        if (!artworkUrl || artworkUrl.trim() === "") {
            return res.status(400).json({ message: "Artwork URL or file is required" });
        }

        const categoryData = {
            id: uuidv4(),
            name: req.body.name.trim(),
            description: req.body.description.trim(),
            artworkUrl: artworkUrl,
            trackCount: parseInt(req.body.trackCount) || 0,
        };

        const category = await playlistService.addCategory(categoryData);
        res.status(201).json(category);
    } catch (err: any) {
        console.error("Error creating category:", err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors || {}).map((e: any) => e.message);
            return res.status(400).json({ message: "Validation error", errors });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ message: "Category with this ID already exists" });
        }

        res.status(400).json({
            message: "Failed to create category",
            error: err.message || "Unknown error"
        });
    }
};

export const createTrack = async (req: Request, res: Response) => {
    try {
        console.log("createTrack called");
        console.log("Req Body:", req.body);
        console.log("Req Files:", req.files);
        // Validate required fields
        if (!req.body.title || req.body.title.trim() === "") {
            return res.status(400).json({ message: "Track title is required" });
        }

        if (!req.body.artist || req.body.artist.trim() === "") {
            return res.status(400).json({ message: "Track artist is required" });
        }

        if (!req.body.album || req.body.album.trim() === "") {
            return res.status(400).json({ message: "Track album is required" });
        }

        if (!req.body.categoryId || req.body.categoryId.trim() === "") {
            return res.status(400).json({ message: "Category ID is required" });
        }

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

        // Validate artworkUrl is provided
        if (!artworkUrl || artworkUrl.trim() === "") {
            return res.status(400).json({ message: "Artwork URL or file is required" });
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

        // Validate audioUrl is provided
        if (!audioUrl || audioUrl.trim() === "") {
            return res.status(400).json({ message: "Audio URL or file is required" });
        }

        // Validate that category exists
        console.log("Checking category existence:", req.body.categoryId);
        const category = await playlistService.getCategory(req.body.categoryId);
        if (!category) {
            console.error("Category not found:", req.body.categoryId);
            return res.status(404).json({ message: "Category not found" });
        }

        // Handle tags: Multer might return a single string if only one tag is present
        let tags: string[] = [];
        if (req.body.tags) {
            if (Array.isArray(req.body.tags)) {
                tags = req.body.tags;
            } else if (typeof req.body.tags === 'string') {
                tags = [req.body.tags];
            }
        }

        // Handle transcript
        let transcript: any[] = [];
        if (req.body.transcript) {
            let transcriptInput = req.body.transcript;

            // If it's an array with one string, extract the string
            if (Array.isArray(transcriptInput) && transcriptInput.length === 1 && typeof transcriptInput[0] === 'string') {
                transcriptInput = transcriptInput[0];
            }

            try {
                if (typeof transcriptInput === 'string') {
                    transcript = JSON.parse(transcriptInput);
                } else if (Array.isArray(transcriptInput)) {
                    transcript = transcriptInput;
                }
            } catch (e) {
                console.error("Error parsing transcript:", e);
                // Fallback to array if it's already one, otherwise empty
                transcript = Array.isArray(transcriptInput) ? transcriptInput : [];
            }

            // Auto-calculate timestamps for LRC nodes if duration is available
            transcript = autoTimestampLRC(transcript, durationMs);
        }

        const trackData = {
            ...req.body,
            id: req.body.id || uuidv4(),
            title: req.body.title.trim(),
            artist: req.body.artist.trim(),
            album: req.body.album.trim(),
            artworkUrl,
            audioUrl,
            durationMs,
            categoryId: req.body.categoryId.trim(),
            tags,
            transcript,
            updatedAt: new Date().toISOString(),
        };


        console.log("Adding track to DB:", trackData);
        const track = await playlistService.addTrack(trackData);
        console.log("Track added successfully");
        res.status(201).json(track);
    } catch (err: any) {
        console.error("Error creating track:", err);
        console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors || {}).map((e: any) => e.message);
            return res.status(400).json({ message: "Validation error", errors });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ message: "Track with this ID already exists" });
        }

        res.status(400).json({
            message: "Failed to create track",
            error: err.message || "Unknown error",
            details: err
        });
    }
};

/* -------------------- UPDATE -------------------- */

// PUT /playlist/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
    try {
        // Check if category exists
        const existingCategory = await playlistService.getCategory(req.params.id);
        if (!existingCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        let updateData: any = { ...req.body };

        // Remove id from updateData if present (shouldn't be updated)
        delete updateData.id;

        // Trim string fields if present
        if (updateData.name) updateData.name = updateData.name.trim();
        if (updateData.description) updateData.description = updateData.description.trim();

        // Validate name if provided
        if (updateData.name !== undefined && updateData.name.trim() === "") {
            return res.status(400).json({ message: "Category name cannot be empty" });
        }

        // Validate description if provided
        if (updateData.description !== undefined && updateData.description.trim() === "") {
            return res.status(400).json({ message: "Category description cannot be empty" });
        }

        if (req.file) {
            const upload = await uploadToCloudinary(req.file, undefined, 'bhakti-bits/categories');
            updateData.artworkUrl = upload.url;
        } else if (updateData.artworkUrl && updateData.artworkUrl.includes('drive.google.com')) {
            const upload = await uploadToCloudinary(undefined, updateData.artworkUrl, 'bhakti-bits/categories');
            updateData.artworkUrl = upload.url;
        }

        // Handle trackCount if provided
        if (updateData.trackCount !== undefined) {
            updateData.trackCount = parseInt(updateData.trackCount) || 0;
        }

        const updated = await playlistService.updateCategory(
            req.params.id,
            updateData
        );
        res.json(updated);
    } catch (err: any) {
        console.error("Error updating category:", err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors || {}).map((e: any) => e.message);
            return res.status(400).json({ message: "Validation error", errors });
        }

        if (err.message === "Category not found") {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(400).json({
            message: "Failed to update category",
            error: err.message || "Unknown error"
        });
    }
};

// PUT /playlist/tracks/:id
export const updateTrack = async (req: Request, res: Response) => {
    try {
        // Check if track exists
        const existingTrack = await playlistService.getTrack(req.params.id);
        if (!existingTrack) {
            return res.status(404).json({ message: "Track not found" });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let updateData: any = { ...req.body };

        // Handle tags: Multer might return a single string if only one tag is present
        if (updateData.tags) {
            if (Array.isArray(updateData.tags)) {
                // already array
            } else if (typeof updateData.tags === 'string') {
                updateData.tags = [updateData.tags];
            }
        }

        // Remove id from updateData if present (shouldn't be updated)
        delete updateData.id;

        // Handle transcript
        if (updateData.transcript) {
            let transcriptInput = updateData.transcript;

            // If it's an array with one string, extract the string
            if (Array.isArray(transcriptInput) && transcriptInput.length === 1 && typeof transcriptInput[0] === 'string') {
                transcriptInput = transcriptInput[0];
            }

            try {
                if (typeof transcriptInput === 'string') {
                    updateData.transcript = JSON.parse(transcriptInput);
                } else if (Array.isArray(transcriptInput)) {
                    updateData.transcript = transcriptInput;
                }
            } catch (e) {
                console.error("Error parsing transcript in update:", e);
                updateData.transcript = Array.isArray(transcriptInput) ? transcriptInput : [];
            }

            // Auto-calculate timestamps for LRC nodes if duration is available
            const finalDuration = updateData.durationMs || existingTrack.durationMs || 0;
            updateData.transcript = autoTimestampLRC(updateData.transcript, finalDuration);
        }


        // Trim string fields if present
        if (updateData.title) updateData.title = updateData.title.trim();
        if (updateData.artist) updateData.artist = updateData.artist.trim();
        if (updateData.album) updateData.album = updateData.album.trim();

        // Validate fields if provided
        if (updateData.title !== undefined && updateData.title.trim() === "") {
            return res.status(400).json({ message: "Track title cannot be empty" });
        }

        if (updateData.artist !== undefined && updateData.artist.trim() === "") {
            return res.status(400).json({ message: "Track artist cannot be empty" });
        }

        if (updateData.album !== undefined && updateData.album.trim() === "") {
            return res.status(400).json({ message: "Track album cannot be empty" });
        }

        // Validate category exists if categoryId is being updated
        if (updateData.categoryId) {
            const category = await playlistService.getCategory(updateData.categoryId);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            updateData.categoryId = updateData.categoryId.trim();
        }

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

        // Handle durationMs if provided
        if (updateData.durationMs !== undefined) {
            updateData.durationMs = parseInt(updateData.durationMs) || 0;
        }

        const updated = await playlistService.updateTrack(
            req.params.id,
            updateData
        );
        res.json(updated);
    } catch (err: any) {
        console.error("Error updating track:", err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors || {}).map((e: any) => e.message);
            return res.status(400).json({ message: "Validation error", errors });
        }

        if (err.message === "Track not found") {
            return res.status(404).json({ message: "Track not found" });
        }

        res.status(400).json({
            message: "Failed to update track",
            error: err.message || "Unknown error"
        });
    }
};

/* -------------------- DELETE -------------------- */

// DELETE /playlist/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        // Check if category exists
        const category = await playlistService.getCategory(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await playlistService.deleteCategory(req.params.id);
        res.status(204).end();
    } catch (err: any) {
        console.error("Error deleting category:", err);
        res.status(500).json({
            message: "Failed to delete category",
            error: err.message || "Unknown error"
        });
    }
};

// DELETE /playlist/tracks/:id
export const deleteTrack = async (req: Request, res: Response) => {
    try {
        // Check if track exists
        console.log("track id:----", req.params.id)
        const track = await playlistService.getTrack(req.params.id);
        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }

        await playlistService.deleteTrack(req.params.id);
        res.status(204).end();
    } catch (err: any) {
        console.error("Error deleting track:", err);
        res.status(500).json({
            message: "Failed to delete track",
            error: err.message || "Unknown error"
        });
    }
};
