import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
    getPlaylist,
    getCategory,
    getCategories,
    getTracksByCategory,
    createCategory,
    createTrack,
    updateCategory,
    updateTrack,
    deleteCategory,
    deleteTrack,
    getTracks,
    getStats,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/playlist", getPlaylist);
router.get("/stats", getStats);
router.get("/playlist/tracks", getTracks);
router.get("/playlist/categories", getCategories);

router.get("/playlist/categories/:id", getCategory);
router.get("/playlist/categories/:id/tracks", getTracksByCategory);

router.post("/playlist/categories", authenticateToken, createCategory);
router.post("/playlist/tracks", authenticateToken, createTrack);

router.put("/playlist/categories/:id", authenticateToken, updateCategory);
router.put("/playlist/tracks/:id", authenticateToken, updateTrack);

router.delete("/playlist/categories/:id", authenticateToken, deleteCategory);
router.delete("/playlist/tracks/:id", authenticateToken, deleteTrack);

export default router;
