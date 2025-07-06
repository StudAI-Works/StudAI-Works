import ApiHandler from "../utils/ApiHandler";
import axios from "axios"
let FAST_API = "http://localhost:8000"
const UserPromtHandler = ApiHandler(async (req, res) => {
    const { Promt } = req.body;
    console.log(req.body)
    console.log("Started to generate")
    console.log(Promt)
    const data = await axios.post(`${FAST_API}/generate`, { userInput: Promt })
    if (!data) {
         res.status(201).send("Error")
    }
    else {
        res.status(200).send(data.data)
    }
})

export default UserPromtHandler