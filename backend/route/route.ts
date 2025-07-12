import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware"; 
import UserPromtHandler from "../controllers/UserPromtHandle";
import { SignUpUser, SignInUser } from "../controllers/authController";
import { Project } from "../controllers/Project";
import { updateProfile, updateAvatar, getProfile } from "../controllers/profileController";
import Allusers from "../controllers/AllUsers";

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- Public routes (no protection) ---
router.route("/").get((req, res) => { res.send("Welcome to StudAI Backend"); });
router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

// --- Protected routes (MUST have a valid token) ---
router.put("/profile", protect, updateProfile); 
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar); 
router.get("/profile",protect, getProfile); 



router.post("/generate", Project);
router.post("/userpromt", UserPromtHandler);
router.route("/allusers").get(Allusers)

export default router;