import { PORT } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { migrateDataToMongo } from "./services/migration.service.js";

const startServer = async () => {
    await connectDB();
    await migrateDataToMongo();
    app.listen(PORT || 4000, () => {
        console.log(`Playlist server running on http://localhost:${PORT}`);
    });
};

startServer();
