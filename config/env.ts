import path from "path";

export const PORT = process.env.PORT || 4000;

export const PLAYLIST_PATH =
    process.env.PLAYLIST_PATH || path.join(process.cwd(), "playlist.json");
