import "dotenv/config";
import path from "path";

export const PORT = process.env.PORT || 4000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export const PLAYLIST_PATH =
    process.env.PLAYLIST_PATH || path.join(process.cwd(), "playlist.json");
export const MONGO_URL = process.env.MONGO_URL || "";

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
