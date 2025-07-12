import ApiHandler from "../utils/ApiHandler";
import axios from "axios";
const Project = ApiHandler(async (req, res) => {
    const { Promt } = req.body
    console.log(Promt)
    let response = await axios.post("http://localhost:8000/generate-and-save", {
        userInput : Promt
    })
    // let data = 
    const data = response.data as { path: string };
    let ProjectId = data.path.split("/")[1]
    // let projectId = 
    if (ProjectId) {
        res.status(200).send(ProjectId)
    } else {
        res.status(201).send("Error")
    }
})



export {Project}