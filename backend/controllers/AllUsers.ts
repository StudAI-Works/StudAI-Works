import supabase from "../supabase/supabase";
import ApiHandler from "../utils/ApiHandler";
import { Request, Response } from "express";
const Allusers = ApiHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from("profiles_with_auth")
        .select("*");
    // console.log(data)
    res.send(data)
})

export default Allusers