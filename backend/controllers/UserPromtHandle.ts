import ApiHandler from "../utils/ApiHandler";

const UserPromtHandler = ApiHandler(async (req, res) => {
    const Promt: string = req.body;
    res.send(Promt)
})

export default UserPromtHandler