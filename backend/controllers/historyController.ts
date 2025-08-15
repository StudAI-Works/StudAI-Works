import { Response } from "express";
import supabase from "../supabase/supabase";
import ApiHandler from "../utils/ApiHandler";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/**
 * @desc    Store user generated file
 * @route   POST /api/history/file
 */
export const storeGeneratedFile = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.log;
    console.log("User ID:", userId);
    console.log("Request body:", req.body);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized, user ID not found in token." });
        return;
    }

    const { fileContent, fileName, fileType } = req.body;

    if (!fileContent || !fileName || !fileType) {
        res.status(400).json({ error: "Missing required file information" });
        return;
    }

    // Create a valid file path with sanitized fileName
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${Date.now()}_${sanitizedFileName}`;

    console.log("Storage upload details:", {
        userId,
        filePath,
        fileName: sanitizedFileName,
        fileType,
        bucket: "user-files"
    });

    try {
        // Convert string content to Buffer if it's not already
        const fileBuffer = typeof fileContent === 'string'
            ? Buffer.from(fileContent)
            : fileContent;

        console.log("Uploading file:", {
            path: filePath,
            type: fileType,
            size: fileBuffer.length
        });

        const { error: uploadError } = await supabase.storage
            .from("user-files")
            .upload(filePath, fileBuffer, {
                contentType: fileType,
                upsert: true,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error("Supabase storage upload error:", uploadError);
            res.status(500).json({ error: "Failed to upload file to storage: " + uploadError.message });
            return;
        }

        console.log("File uploaded successfully");

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("user-files")
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            console.error("Failed to generate public URL");
            res.status(500).json({ error: "Failed to generate public URL for file" });
            return;
        }

        console.log("Generated public URL:", urlData.publicUrl);

        // Store file metadata in database
        const { error: dbError } = await supabase
            .from("user_files")
            .insert({
                user_id: userId,
                file_name: fileName,
                file_type: fileType,
                file_path: filePath,
                public_url: urlData.publicUrl,
                created_at: new Date()
            });

        if (dbError) {
            console.error("Failed to store file metadata:", dbError);
            res.status(500).json({ error: "Failed to store file metadata" });
            return;
        }

        res.status(200).json({
            message: "File stored successfully",
            fileUrl: urlData.publicUrl
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

/**
 * @desc    Store chat message
 * @route   POST /api/history/chat
 */
export const storeChatMessage = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.log;
    console.log("User ID from token:", userId);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized, user ID not found in token." });
        return;
    }

    const { message, role } = req.body;
    console.log("Chat message:", { message, role });

    if (!message || !role) {
        res.status(400).json({ error: "Missing required message information" });
        return;
    }

    try {
        const { error: dbError } = await supabase
            .from("chat_history")
            .insert({
                user_id: userId,
                message,
                role,
                created_at: new Date()
            });

        if (dbError) {
            console.error("Failed to store chat message:", dbError);
            res.status(500).json({ error: "Failed to store chat message" });
            return;
        }

        res.status(200).json({ message: "Chat message stored successfully" });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

/**
 * @desc    Get user's file history
 * @route   GET /api/history/files
 */
export const getFileHistory = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.log;
    console.log("Getting file history for user:", userId);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized, user ID not found in token." });
        return;
    }

    try {
        const { data: files, error } = await supabase
            .from("user_files")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch file history:", error);
            res.status(500).json({ error: "Failed to fetch file history" });
            return;
        }

        console.log("File history retrieved:", files?.length || 0, "files");
        res.status(200).json(files || []);
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

/**
 * @desc    Get user's chat history
 * @route   GET /api/history/chat
 */
export const getChatHistory = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.log;
    console.log("Getting chat history for user:", userId);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized, user ID not found in token." });
        return;
    }

    console.log(userId)

    try {
        const { data: messages, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch chat history:", error);
            res.status(500).json({ error: "Failed to fetch chat history" });
            return;
        }

        console.log("Chat history retrieved:", messages?.length || 0, "messages");
        res.status(200).json(messages || []);
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

/**
 * @desc    Delete user's generated file
 * @route   DELETE /api/history/file/:id
 */
export const deleteGeneratedFile = ApiHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("hello")
    const userId = req.body;
    const fileId = req.params.id;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized, user ID not found in token." });
        return;
    }

    // Get file info from database
    const { data: fileData, error: fetchError } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", userId)
        .single();

    if (fetchError || !fileData) {
        res.status(404).json({ error: "File not found" });
        return;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([fileData.file_path]);

    if (storageError) {
        console.error("Failed to delete file from storage:", storageError);
        res.status(500).json({ error: "Failed to delete file from storage" });
        return;
    }

    // Delete metadata from database
    const { error: dbError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", fileId)
        .eq("user_id", userId);

    if (dbError) {
        console.error("Failed to delete file metadata:", dbError);
        res.status(500).json({ error: "Failed to delete file metadata" });
        return;
    }

    res.status(200).json({ message: "File deleted successfully" });
});
