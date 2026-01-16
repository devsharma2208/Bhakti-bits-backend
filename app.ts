import express from "express";
import cors from "cors";
import router from "./routes/playlist.routes.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

app.use(express.json())

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "If-None-Match"],
        exposedHeaders: ["ETag"],
    })
);
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" })
})
app.use("/auth", authRouter);
app.use("/", router);

export default app;
