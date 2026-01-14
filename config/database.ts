import mongoose from "mongoose";
import { MONGO_URL } from "./env.js";

export const connectDB = async () => {
    try {
        if (!MONGO_URL) {
            console.error("MONGO_URL is not defined in .env file");
            process.exit(1);
        }
        await mongoose.connect(MONGO_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
