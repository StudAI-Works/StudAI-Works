import { Router, RouterOptions } from "express";
import UserPromtHandler from "../controllers/UserPromtHandle";
import authRoutes from "./authRoute";


const router: Router = Router()

router.route("/").get((req, res) => {
    res.send("Welcome to StudAI Backend")
})
router.route("/userpromt").post(UserPromtHandler)
router.use("/auth", authRoutes);
export default router