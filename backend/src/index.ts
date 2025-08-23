import dotenv from "dotenv";
// Load env before importing modules that may use it (e.g., supabase client via router/controllers)
dotenv.config({ override: false });

import app from "./app";
import ApiHandler from "../utils/ApiHandler";
// Import router after dotenv is configured to ensure SUPABASE_* are available
// eslint-disable-next-line @typescript-eslint/no-var-requires
const router = require("../route/route").default as typeof import("../route/route").default;

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
app.use(router);

app.listen(PORT, HOST, () => {
    console.log(`Server running in ${HOST}:${PORT}`)
})