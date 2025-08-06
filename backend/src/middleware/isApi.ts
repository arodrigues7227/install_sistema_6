import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const isApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    
    if (!whatsapp || whatsapp.token !== token) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }
        
    return next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("ERR_INVALID_TOKEN", 403);
  }
};

export default isApi;