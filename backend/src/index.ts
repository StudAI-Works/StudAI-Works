import app from "./app";
import ApiHandler from "../utils/ApiHandler";
import router from "../route/route";
import dotenv from "dotenv"

// Only load .env if environment variables are not already set
dotenv.config({ override: false })

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
app.use(router);

app.listen(PORT, HOST, () => {
    console.log(`Server running in ${HOST}:${PORT}`)
})