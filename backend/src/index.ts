import app from "./app";
import ApiHandler from "../utils/ApiHandler";
import router from "../route/route";


const PORT = 8080

app.use("/api", router); 

app.listen(PORT, () => {
    console.log(`Server running in port:${PORT}`)
})