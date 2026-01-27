import fs from "fs/promises";
import path from "path";
import Category from "../models/Category.js";
import Track from "../models/Track.js";
import { PLAYLIST_PATH } from "../config/env.js";

export const migrateDataToMongo = async () => {
    try {
        const categoriesCount = await Category.countDocuments();
        const tracksCount = await Track.countDocuments();

        if (categoriesCount > 0 || tracksCount > 0) {
            console.log("Data already exists in MongoDB. Skipping migration.");
            return;
        }

        console.log("Starting data migration from playlist.json to MongoDB...");

        // Check if playlist.json exists
        try {
            await fs.access(PLAYLIST_PATH);
        } catch {
            console.warn(`Warning: playlist.json not found at ${PLAYLIST_PATH}. Skipping migration.`);
            return;
        }

        const fileContent = await fs.readFile(PLAYLIST_PATH, "utf-8");
        const data = JSON.parse(fileContent);

        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            await Category.insertMany(data.categories);
            console.log(`Migrated ${data.categories.length} categories.`);
        }

        if (data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
            await Track.insertMany(data.tracks);
            console.log(`Migrated ${data.tracks.length} tracks.`);
        }

        console.log("Data migration completed successfully.");
    } catch (error: any) {
        console.error("Error during data migration:", error);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
    }
};
