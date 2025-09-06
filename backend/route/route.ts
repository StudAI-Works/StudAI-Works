// file: src/routes/route.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import axios from "axios";
import { Readable } from "stream";
import { SignUpUser, SignInUser } from "../controllers/authController";
import {
  saveGeneratedOutput,
  listProjects,
  getProjectDetail,
  editProject,
} from "../controllers/projectsController";
import { updateProfile, updateAvatar, getProfile } from "../controllers/profileController";
import Allusers from "../controllers/AllUsers";
import { protect } from "../middleware/authMiddleware";
import {
  storeGeneratedFile,
  storeChatMessage,
  getFileHistory,
  getChatHistory,
  deleteGeneratedFile,
} from "../controllers/historyController";

const router: Router = Router();

// FastAPI base URL configuration
const RAW_FASTAPI_URL = process.env.FASTAPI_URL;
const FASTAPI_HOST = process.env.FASTAPI_HOST || "localhost";
const FASTAPI_PORT = process.env.FASTAPI_PORT || "8000";
const FAST_API = RAW_FASTAPI_URL?.replace(/\/$/, "") || `http://${FASTAPI_HOST.replace(/\/$/, "")}:${FASTAPI_PORT}`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public routes
router.get("/", (_req: Request, res: Response): void => {
  res.send("Welcome to StudAI Backend");
});
router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

// Protected routes
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/profile", protect, getProfile);
router.get("/allusers", protect, Allusers);

// Conversational AI routes
router.post("/api/start-conversation", async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.post(`${FAST_API}/start-conversation`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error starting conversation:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to start conversation" });
  }
});

// Refine feature
const handleRefine = async (req: Request, res: Response): Promise<void> => {
  const { session_id, message } = req.body;
  if (!session_id || !message) {
    res.status(400).json({ error: "session_id and message are required" });
    return;
  }
  try {
    const response = await axios.post(`${FAST_API}/refine`, { session_id, message });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error refining features:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to refine features", upstream: error.response?.data });
  }
};
router.post("/refine", handleRefine);
router.post("/api/refine", handleRefine);

// History routes
router.get("/history/chat", protect, getChatHistory);
router.post("/history/chat", protect, storeChatMessage);
router.get("/history/files", protect, getFileHistory);
router.post("/history/files", protect, storeGeneratedFile);
router.delete("/history/files/:fileId", protect, deleteGeneratedFile);

// Auth flags for generation & projects
const REQUIRE_AUTH_GENERATE = (process.env.REQUIRE_AUTH_GENERATE || "true").toLowerCase() !== "false";
const REQUIRE_AUTH_PROJECTS = (process.env.REQUIRE_AUTH_PROJECTS || "true").toLowerCase() !== "false";

const maybeProtect = (req: Request, res: Response, next: NextFunction): void => {
  if (!REQUIRE_AUTH_GENERATE) return next();
  protect(req, res, next);
};

const maybeProtectProjects = (req: Request, res: Response, next: NextFunction): void => {
  if (REQUIRE_AUTH_PROJECTS) {
    protect(req, res, next);
    return;
  }
  const authz = req.headers?.authorization || "";
  if (typeof authz === "string" && /^Bearer\s+\S+/.test(authz)) {
    protect(req, res, next);
    return;
  }
  next();
};

// Generate route with stream
router.post("/api/generate", maybeProtect, async (req: Request, res: Response): Promise<void> => {
  const { session_id } = req.body;
  if (!session_id) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const response = await axios({
      method: "post",
      url: `${FAST_API}/api/generate`,
      data: { session_id },
      responseType: "stream",
    });

    const stream = response.data as unknown as Readable;
    stream.pipe(res);

    stream.on("error", (error: any) => {
      console.error("Streaming error:", error.message);
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    });

    req.on("close", () => {
      stream.destroy();
      console.log("Client disconnected, stream closed");
    });
  } catch (error: any) {
    console.error("Error generating code:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to generate code" });
  }
});

// GET /api/generate guidance
router.get("/api/generate", (_req: Request, res: Response): void => {
  res.status(405).json({
    error: "Method Not Allowed",
    message: "Use POST /api/generate with JSON body { session_id } and Authorization bearer token.",
    example: { session_id: "<session-id>" },
  });
});

// AI health check
router.get("/api/ai/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await axios.get(`${FAST_API}/`);
    res.status(200).json({ ok: true, base: FAST_API, ai: data });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ ok: false, base: FAST_API, error: err.response?.data || { message: err.message } });
  }
});

// Project routes - reordered with more specific routes first
router.post("/api/projects/:id/save", maybeProtectProjects, saveGeneratedOutput);
router.post("/api/projects/:id/edit", maybeProtectProjects, editProject);
router.get("/api/projects/:id", maybeProtectProjects, getProjectDetail);
router.get("/api/projects", maybeProtectProjects, listProjects);

export default router;
