import ApiHandler from "../utils/ApiHandler";

const UserPromtHandler = ApiHandler(async (req, res) => {
    const Promt: string = req.body;
    res.status(201).json({
        "success" : Promt
    })
})

export default UserPromtHandler