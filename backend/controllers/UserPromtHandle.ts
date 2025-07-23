import ApiHandler from "../utils/ApiHandler";
import axios from "axios"
let FAST_API = "http://localhost:8000"
const UserPromtHandler = ApiHandler(async (req, res) => {
    const { Promt } = req.body;
    // console.log(req.body)
    console.log("Started to generate")
    console.log(Promt)
    try {
        // Call the FastAPI /spec-chat endpoint
        const response = await axios.post(`${FAST_API}/spec-chat`, {
            user_message: Promt
        });

        // Parse response (adjust keys if your API returns differently)
        const resp = response.data as { got_information: boolean; specs: string;followup: string };

        console.log("Response from spec-chat:", resp);
        const gotInformation = resp.got_information; // boolean: true or false

        if(gotInformation) {
        const specs= resp.specs; // string: the specs if gotInformation is true
        
        const data = await axios.post(`${FAST_API}/generate`, { userInput: Promt, specs: specs });
        if (!data) {
            res.status(201).send("Error")
        }
        else {
            console.log("Response from generate:", data.data);
            res.status(200).send({ data: data.data, gotInformation: true });
        }
        }
        else
        {
            res.status(200).send({ data: resp.followup, gotInformation: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error communicating with spec-chat service");
    }
    
})

export default UserPromtHandler