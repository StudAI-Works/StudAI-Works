import { Request, Response } from "express";
import supabase from "../supabase/supabase";


export const SignUpUser = async (req: Request, res: Response): Promise<void> => {};


export const SignInUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    
    res.status(200).json({
      message: "Signed in successfully",
      user: data.session.user, 
      token: data.session.access_token, // This is the JWT
    });

  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred during signin." });
  }
};