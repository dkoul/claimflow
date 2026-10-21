import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.user) {
    next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    return;
  }
  next();
}

export function getSessionUser(req: Request) {
  const user = req.session.user;
  if (!user) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }
  return user;
}
