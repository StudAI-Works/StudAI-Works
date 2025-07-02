import { Router } from "express";
import UserPromtHandler from "../controllers/UserPromtHandle";
// import authRoutes from "./authRoute";
import { SignUpUser, SignInUser } from "../controllers/authController";

const router: Router = Router()

router.route("/").get((req, res) => {
    res.send("Welcome to StudAI Backend")
})
router.route("/userpromt").post(UserPromtHandler)
// router.use("/auth", authRoutes);
router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

export default router