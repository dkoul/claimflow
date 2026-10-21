export type UserRole = "EMPLOYEE" | "MANAGER" | "FINANCE";

export type ClaimStatus =
  | "DRAFT"
  | "PENDING"
  | "REJECTED"
  | "APPROVED"
  | "REIMBURSED";

export type ClaimCategory =
  | "TRAVEL"
  | "MEALS"
  | "ACCOMMODATION"
  | "EQUIPMENT"
  | "OTHER";

export type HistoryEventType =
  | "CREATED"
  | "EDITED"
  | "SUBMITTED"
  | "RESUBMITTED"
  | "REJECTED"
  | "APPROVED"
  | "REIMBURSED";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  managerId: string | null;
}

export interface ClaimHistoryEvent {
  type: HistoryEventType;
  actorId: string;
  timestamp: string;
  comment?: string;
  previousStatus?: ClaimStatus | null;
  newStatus?: ClaimStatus | null;
}

export interface Claim {
  id: string;
  employeeId: string;
  managerId: string;
  title: string;
  description: string;
  category: ClaimCategory;
  expenseDate: string;
  amount: number;
  currency: string;
  receiptReference: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  history: ClaimHistoryEvent[];
  lastReviewComment?: string;
  approvedById?: string;
  approvedAt?: string;
  reimbursedById?: string;
  reimbursedAt?: string;
}

export interface AppConfig {
  singleClaimLimitInr: number;
  defaultCurrency: string;
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

export interface Category {
  id: ClaimCategory;
  label: string;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
