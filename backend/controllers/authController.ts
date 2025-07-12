import { Request, Response } from "express";
import supabase from "../supabase/supabase";




export const SignUpUser = async (req: Request, res: Response): Promise<void> => {
  const { fullName = "Unnamed User", email, password } = req.body;

  // Basic input validation
  console.log(fullName)
  if (!fullName || !email || !password) {
    res.status(400).json({ error: "Full name, email, and password are required." });
    return;
  }

  try {
    // Step 1: Sign up user using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      res.status(400).json({ error: error?.message || "Signup failed." });
      return;
    }

    const userId = data.user.id;

    // Log user ID and insert payload
    const profileData = {
      id: userId,
      full_name: fullName,
      bio: "",
      website: "",
      avatar_url: "",
    };
    console.log("Inserting Profile:", profileData);

    // Step 2: Insert user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData);

    if (profileError) {
      console.error("Profile Insert Error:", profileError.message);
      res.status(500).json({ error: "User created, but profile insert failed." });
      return;
    }

    // Optional: Fetch inserted profile to confirm
    const { data: insertedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Inserted Profile:", insertedProfile);

    res.status(201).json({
      message: "User signed up successfully",
      user: data.user,
      profile: insertedProfile,
    });

  } catch (err) {
    console.error("Unexpected Signup Error:", err);
    res.status(500).json({ error: "An unexpected error occurred during signup." });
  }
};


export const SignInUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  console.log(email)
  let fullName;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log(data)

    if (error) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    
    let id = data.user.id
    console.log(id)
    const { data: fullname, error: err } = await supabase.from("profiles").select('full_name').eq("id", id)
    console.log(fullname)

    res.status(200).json({
      message: "Signed in successfully",
      fullName : fullname,
      user: data.session.user, 
      token: data.session.access_token, // This is the JWT
    });

  } catch (err) {
    res.status(500).json({ error: "An unexpected error occurred during signin." });
  }
};