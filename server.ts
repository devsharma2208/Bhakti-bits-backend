import { PORT } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { migrateDataToMongo } from "./services/migration.service.js";
import os from "os";

const startServer = async () => {
    try {
        await connectDB();
        await migrateDataToMongo();
        const port = Number(PORT) || 4000;
        const getLocalIP = () => {
            const nets = os.networkInterfaces();
            for (const name of Object.keys(nets || {})) {
                for (const net of nets[name] || []) {
                    if (net.family === 'IPv4' && !net.internal) {
                        return net.address;
                    }
                }
            }
            return 'localhost';
        };
        const localIP = getLocalIP();
        
        app.listen(port, '0.0.0.0', () => {
            console.log(`Playlist server running on http://localhost:${port}`);
            if (localIP !== 'localhost') {
                console.log(`Network access: http://${localIP}:${port}`);
            }
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
