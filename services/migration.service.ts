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

        const data = JSON.parse(await fs.readFile(PLAYLIST_PATH, "utf-8"));

        if (data.categories && data.categories.length > 0) {
            await Category.insertMany(data.categories);
            console.log(`Migrated ${data.categories.length} categories.`);
        }

        if (data.tracks && data.tracks.length > 0) {
            await Track.insertMany(data.tracks);
            console.log(`Migrated ${data.tracks.length} tracks.`);
        }

        console.log("Data migration completed successfully.");
    } catch (error) {
        console.error("Error during data migration:", error);
    }
};
