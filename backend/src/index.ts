import dotenv from "dotenv";
dotenv.config({ override: false });

import express from "express";
import path from "path";

import app from "./app";
import ApiHandler from "../utils/ApiHandler";
import router from "../route/route";

const PORT = Number(process.env.PORT) || Number(process.env.WEBSITES_PORT) || 8080;
const HOST = process.env.HOST || process.env.WEBSITES_HOSTNAME || '0.0.0.0';

app.use('/', router);

// ✅ Absolute path to frontend/dist (from backend/src)
const frontendPath = path.join(__dirname, "../../frontend/dist");

// Serve static assets
app.use(express.static(frontendPath));

// Simple SPA fallback for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, HOST, () => {
    // console.log(`Server running on http://${HOST}:${PORT}`);
});
