import mongoose from "mongoose";
import { MONGO_URL } from "./env.js";
import { GridFSBucket } from "mongodb";

export let bucket: GridFSBucket;

export const connectDB = async () => {
    try {
        if (!MONGO_URL) {
            console.error("MONGO_URL is not defined in .env file");
            process.exit(1);
        }
        const conn = await mongoose.connect(MONGO_URL);

        // Initialize GridFS bucket
        const db = conn.connection.db;
        if (db) {
            bucket = new GridFSBucket(db, {
                bucketName: "uploads"
            });
        }

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
