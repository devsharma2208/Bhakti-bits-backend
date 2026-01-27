import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/playlist.routes.js";
import authRouter from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - must be before other middleware
// The cors middleware automatically handles OPTIONS preflight requests
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "If-None-Match",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ],
        exposedHeaders: ["ETag"],
        credentials: false,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});

app.use("/auth", authRouter);
app.use("/", router);

export default app;
