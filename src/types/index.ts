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

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface ClaimHistoryEvent {
  type: string;
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
  employeeName?: string;
  managerName?: string;
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
}

export interface Category {
  id: ClaimCategory;
  label: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
    details?: Record<string, string>;
  };
}
