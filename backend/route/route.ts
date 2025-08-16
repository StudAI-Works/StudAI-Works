// file: src/routes/route.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import axios from "axios";
import { Readable } from "stream";
import { SignUpUser, SignInUser } from "../controllers/authController";
import { Project } from "../controllers/Project";
import { updateProfile, updateAvatar, getProfile } from "../controllers/profileController";
import Allusers from "../controllers/AllUsers";
import { protect } from "../middleware/authMiddleware";
import dotenv from "dotenv"
const router: Router = Router();

dotenv.config()
// Debug logging for FastAPI connection
// Use environment variable first, then fallback to localhost
const FASTAPI_HOST = 'localhost';
// console.log('FASTAPI_HOST environment variable:', FASTAPI_HOST);
console.log('Final FastAPI URL:', `http://${FASTAPI_HOST}:8000`);

const FAST_API = `http://${FASTAPI_HOST}:8000`; 

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public routes
router.route("/").get((req: Request, res: Response) => {
  res.send("Welcome to StudAI Backend");
});

router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

// Protected routes
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/profile", protect, getProfile);
router.route("/allusers").get(protect, Allusers);

// Conversational AI routes
router.post("/api/start-conversation", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("Starting conversation...");
    const response = await axios.post(`${FAST_API}/start-conversation`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error starting conversation:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to start conversation" });
  }
});

router.post("/refine", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // console.log("refine")
  const { session_id, message,hasGenerated } = req.body;
  console.log("Refine request:", { session_id, message, hasGenerated });
  if (!session_id || !message) {
    res.status(400).json({ error: "session_id and message are required" });
    return;
  }

  if(hasGenerated)
  {
    try {
      const response = await axios.post(`${FAST_API}/parse-text`, { session_id, message });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error refining features:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to refine features" });
    }
  }
  else
  {
    try {
      const response = await axios.post(`${FAST_API}/refine`, { session_id, message });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error refining features:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to refine features" });
    }
  }
});



router.post("/load_llm", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // console.log("refine")
  const { session_id } = req.body;
  console.log("Refine request:", { session_id});
  if (!session_id ) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }
    try {
      const response = await axios.post(`${FAST_API}/load_llm`, { session_id });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error loading code", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to load code" });
    }
});


router.post("/api/generate", protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      url: `${FAST_API}/generate`,
      data: { session_id },
      responseType: "stream",
    }) as unknown as { data: Readable };

    // Pipe the stream to the response
    response.data.pipe(res);

    // Handle stream errors
    response.data.on("error", (error: any) => {
      console.error("Streaming error:", error.message);
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      response.data.destroy();
      console.log("Client disconnected, stream closed");
    });
  } catch (error: any) {
    console.error("Error generating code:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to generate code" });
  }
});

// Legacy route
router.post("/generate", protect, Project);

export default router;