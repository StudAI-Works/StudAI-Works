// file: src/routes/route.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import axios from "axios";
import { Readable } from "stream";
import { SignUpUser, SignInUser } from "../controllers/authController";
import { saveGeneratedOutput, listProjects, getProjectDetail, editProject, deleteProject, createBlankProject } from "../controllers/projectsController";
import { updateProfile, updateAvatar, getProfile } from "../controllers/profileController";
import Allusers from "../controllers/AllUsers";
import { protect } from "../middleware/authMiddleware";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAI } from "openai";
// import client from "../src/lib/azureOpenAI"; // Removed to avoid conflict with local declaration
import systemPrompt from "../route/prompt";
const router: Router = Router();

// Prefer FASTAPI_URL, else construct from HOST and PORT
const RAW_FASTAPI_URL = process.env.FASTAPI_URL;
const FASTAPI_HOST = process.env.FASTAPI_HOST || "localhost";
const FASTAPI_PORT = process.env.FASTAPI_PORT || "8000";
const FAST_API = process.env.FASTAPI_URL

// Auth gating flags (default to off in non-production)
const REQUIRE_AUTH_GENERATE = (() => {
  const v = process.env.REQUIRE_AUTH_GENERATE;
  if (v != null) return v.toLowerCase() !== "false";
  return process.env.NODE_ENV === "production";
})();

const REQUIRE_AUTH_PROJECTS = (() => {
  const v = process.env.REQUIRE_AUTH_PROJECTS;
  if (v != null) return v.toLowerCase() !== "false";
  return process.env.NODE_ENV === "production";
})();

const maybeProtect = (req: Request, res: Response, next: NextFunction) => {
  if (!REQUIRE_AUTH_GENERATE) return next();
  return (protect as any)(req, res, next);
};

const maybeProtectProjects = (req: Request, res: Response, next: NextFunction) => {
  // If auth is required, always protect
  if (REQUIRE_AUTH_PROJECTS) return (protect as any)(req, res, next);
  // If not required but a bearer token is provided, populate req.user for ownership
  const authz = req.headers?.authorization || '';
  if (typeof authz === 'string' && /^Bearer\s+\S+/.test(authz)) {
    return (protect as any)(req, res, next);
  }
  return next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public routes
router.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to StudAI Backend");
});
router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

// Protected routes
router.put("/profile", updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.post("/profile", getProfile);
router.get("/allusers", protect, Allusers);

// Conversational AI routes
router.post("/start-conversation", async (_req: Request, res: Response): Promise<void> => {
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
    const status = error.response?.status || 500;
    const upstream = error.response?.data;
    res.status(status).json({ error: "Failed to refine", upstream });
  }
};

// router.post("/api/refine", handleRefine);

// Backward-compatible alias
router.post("/refine", handleRefine);

// Generate (SSE proxy)
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

    const response = (await axios({
      method: "post",
      url: `${FAST_API}/generate`,
      data: { session_id },
      responseType: "stream",
    })) as unknown as { data: Readable };

    response.data.pipe(res);

    response.data.on("error", (error: any) => {
      console.error("Streaming error:", error.message);
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    });

    req.on("close", () => {
      response.data.destroy();
      console.log("Client disconnected, stream closed");
    });
  } catch (error: any) {
    console.error("Error generating code:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to generate code" });
  }
});

// Helpful guidance for accidental GET requests
router.get("/api/generate", (_req: Request, res: Response): void => {
  res.status(405).json({
    error: "Method Not Allowed",
    message: "Use POST /api/generate with JSON body { session_id }.",
    example: { session_id: "<session-id>" },
  });
});

// AI health: check connectivity
router.get("/api/ai/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await axios.get(`${FAST_API}/`);
    res.status(200).json({ ok: true, base: FAST_API, ai: data });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ ok: false, base: FAST_API, error: err.response?.data || { message: err.message } });
  }
});

// Quick config endpoint to see auth gating flags (dev aid)
router.get("/api/config", (_req: Request, res: Response): void => {
  res.status(200).json({
    REQUIRE_AUTH_GENERATE,
    REQUIRE_AUTH_PROJECTS,
    FAST_API,
  });
});

// Project routes
router.post("/api/projects/:id/save", maybeProtectProjects, saveGeneratedOutput);
router.post("/api/projects/:id/edit", maybeProtectProjects, editProject);
router.get("/api/projects", listProjects);
router.get("/api/projects/:id", maybeProtectProjects, getProjectDetail);
router.delete("/api/projects/:id", maybeProtectProjects, deleteProject);
router.post("/api/projects", maybeProtectProjects, createBlankProject);


const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_KEY },
});

router.post("/chatbot", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const botResponse = response.choices[0].message?.content || "No response generated.";
    res.json({ response: botResponse });
  } catch (err: any) {
    console.error("Azure OpenAI API Error:", err.message || err);
    res.status(500).json({ error: "Failed to get chatbot response" });
  }
});

// Legacy route removed: use /api/start-conversation, /api/refine, and /api/generate instead.

export default router;
