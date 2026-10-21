import { Router } from "express";
import { getUsers } from "../repositories/dataRepository.js";
import { enrichClaimForResponse, getDashboard } from "../services/claimService.js";
import { getSessionUser, requireAuth } from "../middleware/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const data = await getDashboard(user);
    const users = await getUsers();
    const map = new Map(
      users.map((u) => [u.id, { displayName: u.displayName, username: u.username }]),
    );

    const enrichList = (claims: unknown[]) =>
      (claims as import("../types.js").Claim[]).map((c) =>
        enrichClaimForResponse(c, map),
      );

    if (data.role === "EMPLOYEE") {
      res.json({
        ...data,
        recentClaims: enrichList(data.recentClaims),
      });
      return;
    }

    if (data.role === "MANAGER") {
      res.json({
        ...data,
        pendingClaims: enrichList(data.pendingClaims),
        recentlyReviewed: enrichList(data.recentlyReviewed),
      });
      return;
    }

    res.json({
      ...data,
      awaitingReimbursement: enrichList(data.awaitingReimbursement),
      recentlyProcessed: enrichList(data.recentlyProcessed),
    });
  } catch (err) {
    next(err);
  }
});
