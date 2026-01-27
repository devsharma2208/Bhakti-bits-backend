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
    streamMedia,
} from "../controllers/playlist.controller.js";
import multer from 'multer';

const router = Router();
router.get("/media/:id", streamMedia);
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/playlist", getPlaylist);
router.get("/stats", getStats);
router.get("/playlist/tracks", getTracks);
router.get("/playlist/categories", getCategories);

router.get("/playlist/categories/:id", getCategory);
router.get("/playlist/categories/:id/tracks", getTracksByCategory);

router.post("/playlist/categories", authenticateToken, upload.single('artwork'), createCategory);
router.post("/playlist/tracks", authenticateToken, upload.fields([{ name: 'artwork', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), createTrack);

router.put("/playlist/categories/:id", authenticateToken, upload.single('artwork'), updateCategory);
router.put("/playlist/tracks/:id", authenticateToken, upload.fields([{ name: 'artwork', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), updateTrack);

router.delete("/playlist/categories/:id", authenticateToken, deleteCategory);
router.delete("/playlist/tracks/:id", authenticateToken, deleteTrack);

export default router;
