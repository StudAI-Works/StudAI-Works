import { Router, RouterOptions } from "express";
import UserPromtHandler from "../controllers/UserPromtHandle";
const router: Router = Router()

router.route("/").get((req, res) => {
    res.send("Welcome to StudAI Backend")
})
router.route("/userpromt").post(UserPromtHandler)

export default router