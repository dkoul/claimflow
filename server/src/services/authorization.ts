import type { Claim, SessionUser, User } from "../types.js";

export function canViewClaim(user: SessionUser, claim: Claim): boolean {
  if (user.role === "FINANCE") return true;
  if (user.role === "EMPLOYEE") return claim.employeeId === user.id;
  if (user.role === "MANAGER") return claim.managerId === user.id;
  return false;
}

export function canEditClaim(user: SessionUser, claim: Claim): boolean {
  return (
    user.role === "EMPLOYEE" &&
    claim.employeeId === user.id &&
    (claim.status === "DRAFT" || claim.status === "REJECTED")
  );
}

export function canSubmitClaim(user: SessionUser, claim: Claim): boolean {
  return (
    user.role === "EMPLOYEE" &&
    claim.employeeId === user.id &&
    (claim.status === "DRAFT" || claim.status === "REJECTED")
  );
}

export function canApproveOrReject(user: SessionUser, claim: Claim): boolean {
  return (
    user.role === "MANAGER" &&
    claim.managerId === user.id &&
    claim.status === "PENDING"
  );
}

export function canReimburse(user: SessionUser, claim: Claim): boolean {
  return user.role === "FINANCE" && claim.status === "APPROVED";
}

export function filterClaimsForUser(
  user: SessionUser,
  claims: Claim[],
): Claim[] {
  if (user.role === "FINANCE") return claims;
  if (user.role === "MANAGER") {
    return claims.filter((c) => c.managerId === user.id);
  }
  return claims.filter((c) => c.employeeId === user.id);
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}
