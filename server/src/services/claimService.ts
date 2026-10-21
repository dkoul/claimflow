import {
  findUserById,
  getAppConfig,
  getClaims,
  saveClaims,
} from "../repositories/dataRepository.js";
import type { Claim, ClaimHistoryEvent, SessionUser } from "../types.js";
import { AppError } from "../utils/errors.js";
import { validateClaimFields, type ClaimInput } from "../validation/claimValidation.js";
import {
  canApproveOrReject,
  canEditClaim,
  canReimburse,
  canSubmitClaim,
  canViewClaim,
} from "./authorization.js";

function nowIso(): string {
  return new Date().toISOString();
}

function nextClaimId(claims: Claim[]): string {
  const nums = claims
    .map((c) => {
      const m = /^CLM-(\d+)$/.exec(c.id);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1001;
  return `CLM-${next}`;
}

function appendHistory(
  claim: Claim,
  event: Omit<ClaimHistoryEvent, "timestamp"> & { timestamp?: string },
): void {
  claim.history.push({
    ...event,
    timestamp: event.timestamp ?? nowIso(),
  });
}

export async function listClaimsForUser(
  user: SessionUser,
  options: {
    search?: string;
    status?: string;
    category?: string;
    sort?: string;
    sortDir?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<{
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const config = await getAppConfig();
  const all = await getClaims();
  let filtered = all.filter((c) => canViewClaim(user, c));

  const search = (options.search ?? "").trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search),
    );
  }

  if (options.status) {
    filtered = filtered.filter((c) => c.status === options.status);
  }

  if (options.category) {
    filtered = filtered.filter((c) => c.category === options.category);
  }

  const sortField = options.sort ?? "updatedAt";
  const sortDir = options.sortDir === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (sortField === "expenseDate") {
      av = a.expenseDate;
      bv = b.expenseDate;
    } else if (sortField === "amount") {
      av = a.amount;
      bv = b.amount;
    } else {
      av = a.updatedAt;
      bv = b.updatedAt;
    }
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return 0;
  });

  const pageSize = Math.min(
    Math.max(1, options.pageSize ?? config.pagination.defaultPageSize),
    config.pagination.maxPageSize,
  );
  const page = Math.max(1, options.page ?? 1);
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export async function getClaimForUser(
  user: SessionUser,
  id: string,
): Promise<Claim> {
  const claims = await getClaims();
  const claim = claims.find((c) => c.id === id);
  if (!claim || !canViewClaim(user, claim)) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }
  return claim;
}

export async function createClaim(
  user: SessionUser,
  input: ClaimInput,
  submit: boolean,
): Promise<Claim> {
  if (user.role !== "EMPLOYEE") {
    throw new AppError(403, "Only employees can create claims", "FORBIDDEN");
  }

  const employee = await findUserById(user.id);
  if (!employee?.managerId) {
    throw new AppError(422, "Employee has no assigned manager", "VALIDATION_ERROR");
  }

  const config = await getAppConfig();
  const fields = validateClaimFields(input, config);
  const claims = await getClaims();
  const ts = nowIso();

  const claim: Claim = {
    id: nextClaimId(claims),
    employeeId: user.id,
    managerId: employee.managerId,
    ...fields,
    currency: config.defaultCurrency,
    status: submit ? "PENDING" : "DRAFT",
    createdAt: ts,
    updatedAt: ts,
    version: 1,
    history: [
      {
        type: "CREATED",
        actorId: user.id,
        timestamp: ts,
        previousStatus: null,
        newStatus: "DRAFT",
      },
    ],
  };

  if (submit) {
    appendHistory(claim, {
      type: "SUBMITTED",
      actorId: user.id,
      previousStatus: "DRAFT",
      newStatus: "PENDING",
    });
    claim.version = 2;
    claim.updatedAt = nowIso();
  }

  claims.push(claim);
  await saveClaims(claims);
  return claim;
}

export async function updateClaim(
  user: SessionUser,
  id: string,
  input: ClaimInput,
  expectedVersion: number,
): Promise<Claim> {
  const config = await getAppConfig();
  const fields = validateClaimFields(input, config);
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }

  const claim = claims[index];
  if (!canEditClaim(user, claim)) {
    throw new AppError(403, "Cannot edit this claim", "FORBIDDEN");
  }

  if (claim.version !== expectedVersion) {
    throw new AppError(
      409,
      "Claim was updated by another process. Reload and try again.",
      "VERSION_CONFLICT",
    );
  }

  Object.assign(claim, fields);
  claim.updatedAt = nowIso();
  claim.version += 1;
  appendHistory(claim, {
    type: "EDITED",
    actorId: user.id,
    previousStatus: claim.status,
    newStatus: claim.status,
  });

  claims[index] = claim;
  await saveClaims(claims);
  return claim;
}

export async function submitClaim(
  user: SessionUser,
  id: string,
): Promise<Claim> {
  const config = await getAppConfig();
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }

  const claim = claims[index];
  if (!canSubmitClaim(user, claim)) {
    throw new AppError(403, "Cannot submit this claim", "FORBIDDEN");
  }

  if (claim.status === "PENDING") {
    throw new AppError(409, "Claim is already pending", "INVALID_STATE");
  }

  validateClaimFields(claim, config);

  const wasRejected = claim.status === "REJECTED";
  const previousStatus = claim.status;
  claim.status = "PENDING";
  claim.updatedAt = nowIso();
  claim.version += 1;
  appendHistory(claim, {
    type: wasRejected ? "RESUBMITTED" : "SUBMITTED",
    actorId: user.id,
    previousStatus,
    newStatus: "PENDING",
  });

  claims[index] = claim;
  await saveClaims(claims);
  return claim;
}

export async function approveClaim(
  user: SessionUser,
  id: string,
  comment?: string,
): Promise<Claim> {
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }

  const claim = claims[index];
  if (!canApproveOrReject(user, claim)) {
    throw new AppError(403, "Cannot approve this claim", "FORBIDDEN");
  }

  if (claim.status !== "PENDING") {
    throw new AppError(409, "Only pending claims can be approved", "INVALID_STATE");
  }

  claim.status = "APPROVED";
  claim.approvedById = user.id;
  claim.approvedAt = nowIso();
  claim.updatedAt = claim.approvedAt;
  claim.version += 1;
  appendHistory(claim, {
    type: "APPROVED",
    actorId: user.id,
    comment: comment?.trim() || undefined,
    previousStatus: "PENDING",
    newStatus: "APPROVED",
  });

  claims[index] = claim;
  await saveClaims(claims);
  return claim;
}

export async function rejectClaim(
  user: SessionUser,
  id: string,
  reason: string,
): Promise<Claim> {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) {
    throw new AppError(422, "Rejection reason is required", "VALIDATION_ERROR", {
      reason: "Rejection reason is required",
    });
  }

  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }

  const claim = claims[index];
  if (!canApproveOrReject(user, claim)) {
    throw new AppError(403, "Cannot reject this claim", "FORBIDDEN");
  }

  if (claim.status !== "PENDING") {
    throw new AppError(409, "Only pending claims can be rejected", "INVALID_STATE");
  }

  claim.status = "REJECTED";
  claim.lastReviewComment = trimmed;
  claim.updatedAt = nowIso();
  claim.version += 1;
  appendHistory(claim, {
    type: "REJECTED",
    actorId: user.id,
    comment: trimmed,
    previousStatus: "PENDING",
    newStatus: "REJECTED",
  });

  claims[index] = claim;
  await saveClaims(claims);
  return claim;
}

export async function reimburseClaim(
  user: SessionUser,
  id: string,
): Promise<Claim> {
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new AppError(404, "Claim not found", "NOT_FOUND");
  }

  const claim = claims[index];
  if (!canReimburse(user, claim)) {
    throw new AppError(403, "Cannot reimburse this claim", "FORBIDDEN");
  }

  if (claim.status !== "APPROVED") {
    throw new AppError(409, "Only approved claims can be reimbursed", "INVALID_STATE");
  }

  claim.status = "REIMBURSED";
  claim.reimbursedById = user.id;
  claim.reimbursedAt = nowIso();
  claim.updatedAt = claim.reimbursedAt;
  claim.version += 1;
  appendHistory(claim, {
    type: "REIMBURSED",
    actorId: user.id,
    previousStatus: "APPROVED",
    newStatus: "REIMBURSED",
  });

  claims[index] = claim;
  await saveClaims(claims);
  return claim;
}

export async function getDashboard(user: SessionUser) {
  const claims = await getClaims();
  const visible = claims.filter((c) => canViewClaim(user, c));

  if (user.role === "EMPLOYEE") {
    const mine = visible.filter((c) => c.employeeId === user.id);
    const draftCount = mine.filter((c) => c.status === "DRAFT").length;
    const pendingCount = mine.filter((c) => c.status === "PENDING").length;
    const rejectedCount = mine.filter((c) => c.status === "REJECTED").length;
    const approvedTotal = mine
      .filter((c) => c.status === "APPROVED" || c.status === "REIMBURSED")
      .reduce((sum, c) => sum + c.amount, 0);
    const recent = [...mine]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 5);

    return {
      role: user.role,
      stats: {
        draftCount,
        pendingCount,
        rejectedCount,
        approvedTotal,
      },
      recentClaims: recent,
    };
  }

  if (user.role === "MANAGER") {
    const pending = visible.filter((c) => c.status === "PENDING");
    const pendingTotal = pending.reduce((sum, c) => sum + c.amount, 0);
    const recentlyReviewed = visible
      .filter((c) =>
        c.history.some(
          (h) =>
            (h.type === "APPROVED" || h.type === "REJECTED") &&
            h.actorId === user.id,
        ),
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 5);

    return {
      role: user.role,
      stats: {
        pendingCount: pending.length,
        pendingTotal,
      },
      pendingClaims: pending.slice(0, 10),
      recentlyReviewed,
    };
  }

  const awaiting = visible.filter((c) => c.status === "APPROVED");
  const reimbursed = visible.filter((c) => c.status === "REIMBURSED");
  const awaitingTotal = awaiting.reduce((sum, c) => sum + c.amount, 0);
  const reimbursedTotal = reimbursed.reduce((sum, c) => sum + c.amount, 0);
  const recentlyProcessed = [...visible]
    .filter((c) => c.status === "REIMBURSED" || c.status === "APPROVED")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  return {
    role: user.role,
    stats: {
      awaitingCount: awaiting.length,
      awaitingTotal,
      reimbursedTotal,
    },
    awaitingReimbursement: awaiting.slice(0, 10),
    recentlyProcessed,
  };
}

export function enrichClaimForResponse(
  claim: Claim,
  usersMap: Map<string, { displayName: string; username: string }>,
): Claim & { employeeName: string; managerName: string } {
  return {
    ...claim,
    employeeName:
      usersMap.get(claim.employeeId)?.displayName ?? claim.employeeId,
    managerName: usersMap.get(claim.managerId)?.displayName ?? claim.managerId,
  };
}
