import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors"
const app: Express = express()
app.use(cors({
    origin: ["http://localhost:5173", "https://studai-builder-frontend.ambitiousriver-27aa23ca.southindia.azurecontainerapps.io", "https://studai-builder-frontend.ambitiousriver-27aa23ca.southindia.azurecontainerapps.io", "https://studai-builder-frontend--0000003.ambitiousriver-27aa23ca.southindia.azurecontainerapps.io"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}))
app.use(express.json())
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

export default app