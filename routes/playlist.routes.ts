import { Router } from "express";
import {
    getPlaylist,
    getCategory,
    getTracksByCategory,
    createCategory,
    createTrack,
    updateCategory,
    updateTrack,
    deleteCategory,
    deleteTrack,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/playlist", getPlaylist);

router.get("/playlist/categories/:id", getCategory);
router.get("/playlist/categories/:id/tracks", getTracksByCategory);

router.post("/playlist/categories", createCategory);
router.post("/playlist/tracks", createTrack);

router.put("/playlist/categories/:id", updateCategory);
router.put("/playlist/tracks/:id", updateTrack);

router.delete("/playlist/categories/:id", deleteCategory);
router.delete("/playlist/tracks/:id", deleteTrack);

export default router;
