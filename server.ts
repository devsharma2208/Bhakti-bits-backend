import { PORT } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { migrateDataToMongo } from "./services/migration.service.js";

const startServer = async () => {
    try {
        await connectDB();
        await migrateDataToMongo();
        app.listen(PORT || 4000, () => {
            console.log(`Playlist server running on http://localhost:${PORT || 4000}`);
        });
    } catch (error: any) {
        console.error("Failed to start server:", error);
        console.error("Error details:", error?.message || error);
        console.error("Stack trace:", error?.stack);
        process.exit(1);
    }
};

startServer().catch((error) => {
    console.error("Unhandled error in startServer:", error);
    process.exit(1);
});
