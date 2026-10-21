import { Router } from "express";
import { getUsers } from "../repositories/dataRepository.js";
import {
  approveClaim,
  createClaim,
  enrichClaimForResponse,
  getClaimForUser,
  listClaimsForUser,
  rejectClaim,
  reimburseClaim,
  submitClaim,
  updateClaim,
} from "../services/claimService.js";
import { getSessionUser, requireAuth } from "../middleware/auth.js";

export const claimsRoutes = Router();

claimsRoutes.use(requireAuth);

async function usersMap() {
  const users = await getUsers();
  return new Map(
    users.map((u) => [u.id, { displayName: u.displayName, username: u.username }]),
  );
}

claimsRoutes.get("/", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const result = await listClaimsForUser(user, {
      search: req.query.search as string,
      status: req.query.status as string,
      category: req.query.category as string,
      sort: req.query.sort as string,
      sortDir: req.query.sortDir as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    });
    const map = await usersMap();
    res.json({
      ...result,
      items: result.items.map((c) => enrichClaimForResponse(c, map)),
    });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.post("/", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const submit = Boolean(req.body?.submit);
    const claim = await createClaim(user, req.body, submit);
    const map = await usersMap();
    res.status(201).json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.get("/:id", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const claim = await getClaimForUser(user, req.params.id);
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.patch("/:id", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const version = Number(req.body?.version);
    if (!Number.isFinite(version)) {
      res.status(422).json({
        error: {
          message: "version is required",
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }
    const claim = await updateClaim(user, req.params.id, req.body, version);
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.post("/:id/submit", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const claim = await submitClaim(user, req.params.id);
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.post("/:id/approve", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const claim = await approveClaim(user, req.params.id, req.body?.comment);
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.post("/:id/reject", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const claim = await rejectClaim(user, req.params.id, req.body?.reason ?? "");
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});

claimsRoutes.post("/:id/reimburse", async (req, res, next) => {
  try {
    const user = getSessionUser(req);
    const claim = await reimburseClaim(user, req.params.id);
    const map = await usersMap();
    res.json({ claim: enrichClaimForResponse(claim, map) });
  } catch (err) {
    next(err);
  }
});
