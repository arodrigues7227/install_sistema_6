import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";

const isAuthCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [, token] = authHeader.split(" ");
  
  try {
    const getToken = "4a1f3e8d9c7b2a6e5f4c3d2a1b0e9f8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2";
    if (!getToken) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    if (getToken !== token) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }
  } catch (err) {
    throw new AppError(
      "Invalid token. We'll try to assign a new one on next request",
      403
    );
  }

  return next();
};

export default isAuthCompany;
