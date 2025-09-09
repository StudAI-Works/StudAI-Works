import { Request, Response, NextFunction } from "express";
import supabase from "../supabase/supabase";


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;
  // console.log(req)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (format: "Bearer TOKEN")
      token = req.headers.authorization.split(" ")[1];
      console.log(req.headers.authorization.split(" ")[1])

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        
        res.status(401).json({ error: "Not authorized, token failed" });
        return; 
      }

      
      req.user = { id: user.id };

      next(); 
    } catch (error) {
      console.error(error);
      
      res.status(401).json({ error: "Not authorized, token failed" });
      return; 
    }
  }

  if (!token) {
    console.log(token)

    res.status(401).json({ error: "Not authorized, no token" });
    return; 
  }
};