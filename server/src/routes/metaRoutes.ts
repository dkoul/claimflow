import { Router } from "express";
import { getAppConfig, getCategories } from "../repositories/dataRepository.js";
import { requireAuth } from "../middleware/auth.js";

export const metaRoutes = Router();

metaRoutes.get("/categories", requireAuth, async (_req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

metaRoutes.get("/config", requireAuth, async (_req, res, next) => {
  try {
    const config = await getAppConfig();
    res.json({
      singleClaimLimitInr: config.singleClaimLimitInr,
      defaultCurrency: config.defaultCurrency,
      pagination: config.pagination,
    });
  } catch (err) {
    next(err);
  }
});
