import { Request, Response } from "express";
import playlistService from "../services/playlist.service.js";
import { v4 as uuidv4 } from "uuid"; // for generating unique IDs

/* -------------------- READ -------------------- */

// GET /playlist
export const getPlaylist = (req: Request, res: Response) => {
    const ifNoneMatch = req.headers["if-none-match"];
    const { body, etag } = playlistService.getPlaylist();

    if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("ETag", etag as string);
    res.status(200).json(body);
};

// GET /playlist/categories/:id
export const getCategory = (req: Request, res: Response) => {
    const category = playlistService.getCategory(req.params.id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
};

// GET /playlist/categories/:id/tracks
export const getTracksByCategory = (req: Request, res: Response) => {
    const tracks = playlistService.getTracksByCategory(req.params.id);
    res.json(tracks);
};

/* -------------------- CREATE -------------------- */

// POST /playlist/categories
export const createCategory = async (req: Request, res: Response) => {
    console.log(req.body);
    try {
        // Ensure all required fields exist
        const categoryData = {
            id: uuidv4(),
            name: req.body.name || "Untitled Category",
            description: req.body.description || "",
            artworkUrl: req.body.artworkUrl || "",
            trackCount: req.body.trackCount || 0,
        };

        const category = await playlistService.addCategory(categoryData);
        res.status(201).json(category);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Failed to create category" });
    }
};

// POST /playlist/tracks
export const createTrack = async (req: Request, res: Response) => {
    try {
        const track = await playlistService.addTrack({
            ...req.body,
            updatedAt: new Date().toISOString(),
        });
        res.status(201).json(track);
    } catch (err) {
        res.status(400).json({ message: "Failed to create track" });
    }
};

/* -------------------- UPDATE -------------------- */

// PUT /playlist/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const updated = await playlistService.updateCategory(
            req.params.id,
            req.body
        );
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Category not found" });
    }
};

// PUT /playlist/tracks/:id
export const updateTrack = async (req: Request, res: Response) => {
    try {
        const updated = await playlistService.updateTrack(
            req.params.id,
            req.body
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
