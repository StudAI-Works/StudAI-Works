import express, { Express } from "express";
import cors from "cors"
const app: Express = express()
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))
app.use(express.json())

export default app