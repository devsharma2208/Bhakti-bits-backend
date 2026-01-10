import express from "express";
import cors from "cors";
import router from "./routes/playlist.routes.js";

const app = express();

app.use(express.json())

app.use(
    cors({
        origin: "*",
        methods: ["GET"],
        allowedHeaders: ["Content-Type", "If-None-Match"],
        exposedHeaders: ["ETag"],
    })
);

app.use("/", router);

export default app;
