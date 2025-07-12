import { Response } from "express";
import supabase from "../supabase/supabase";
import ApiHandler from "../utils/ApiHandler";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/**
 * @desc    Get the current logged-in user's profile
 * @route   GET /api/profile
 */
export const getProfile = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized, user ID not found in token." });
    return;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Get profile error (user might not have a profile row yet):", error.message);
    
    res.status(200).json({ id: userId, full_name: '', bio: '', website: '', avatar_url: '' });
    return; 
  }

  res.status(200).json(profile);
});


/**
 * @desc    Update user's text-based profile information
 * @route   PUT /api/profile
 */
export const updateProfile = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    res.status(401).json({ error: "Unauthorized, user ID not found in token." });
    return;
  }

  const { fullName, bio, website } = req.body;


  const { data: updatedProfile, error: upsertError } = await supabase
    .from("profiles")
    .upsert({
      id: userId, 
      full_name: fullName,
      bio: bio, 
      website: website,
      updated_at: new Date(),
    })
    .select() 
    .single(); 

  if (upsertError) {
    console.error("Supabase profile upsert error:", upsertError);
    throw new Error("Failed to save profile data.");
  }

  
  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: { full_name: fullName } }
  );

  if (authError) {
    console.error("Failed to sync full_name to auth.users:", authError.message);
  }
  
  
  res.status(200).json(updatedProfile);
});


/**
 * @desc    Upload or update a user's avatar
 * @route   POST /api/profile/avatar
 */
export const updateAvatar = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized, user ID not found in token." });
    return;
  }
  
  if (!req.file) {
    res.status(400).json({ error: "No file was uploaded." });
    return;
  }

  const file = req.file;
  const filePath = `${userId}/${Date.now()}_${file.originalname}`;

  
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError);
    throw new Error("Failed to upload avatar to storage.");
  }

  
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);
  
  const publicUrl = urlData.publicUrl;


  const { error: dbError } = await supabase
    .from("profiles")
    .upsert({ id: userId, avatar_url: publicUrl, updated_at: new Date() });

  if (dbError) {
    console.error("Supabase profile avatar URL update error:", dbError);
    throw new Error("Avatar uploaded, but failed to update the profile link.");
  }

  
  res.status(200).send({ avatarUrl: publicUrl });
});