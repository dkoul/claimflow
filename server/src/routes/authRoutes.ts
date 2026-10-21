import bcrypt from "bcryptjs";
import { Router } from "express";
import credentials from "../fixtures/credentials.json" with { type: "json" };
import { findUserByUsername } from "../repositories/dataRepository.js";
import { toSessionUser } from "../services/authorization.js";
import { AppError } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/login", async (req, res, next) => {
  try {
    const username = (req.body?.username ?? "").trim();
    const password = req.body?.password ?? "";

    if (!username || !password) {
      throw new AppError(422, "Username and password are required", "VALIDATION_ERROR");
    }

    const user = await findUserByUsername(username);
    const hash = credentials.users[username as keyof typeof credentials.users];
    if (!user || !hash) {
      throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
    }

    req.session.user = toSessionUser(user);
    res.json({ user: req.session.user });
  } catch (err) {
    next(err);
  }
});

authRoutes.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

authRoutes.get("/me", (req, res, next) => {
  try {
    if (!req.session.user) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }
    res.json({ user: req.session.user });
  } catch (err) {
    next(err);
  }
});
