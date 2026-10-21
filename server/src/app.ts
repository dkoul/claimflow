import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import path from "node:path";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { claimsRoutes } from "./routes/claimsRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { metaRoutes } from "./routes/metaRoutes.js";
import { REPO_ROOT } from "./utils/paths.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "claimflow-workshop-demo-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/claims", claimsRoutes);
  app.use("/api/meta", metaRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: { message: "API route not found", code: "NOT_FOUND" },
    });
  });

  const clientDist = path.join(REPO_ROOT, "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  app.use(errorHandler);

  return app;
}
