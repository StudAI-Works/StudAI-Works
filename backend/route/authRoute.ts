import { Router } from "express";
import { SignUpUser, SignInUser } from "../controllers/authController";

const router = Router();

router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

export default router;
