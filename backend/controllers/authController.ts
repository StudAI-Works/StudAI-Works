import { Request, Response } from "express";
import supabase from "../supabase/supabase";

export const SignUpUser = async (req: Request, res: Response): Promise<void> => {
  
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ error: "Full name, email, and password are required." });
    return;
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: "User created successfully. Please sign in.", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred during signup." });
  }
};

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

    res.status(200).json({ message: "Signed in", session: data.session });
  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred during signin." });
  }
};