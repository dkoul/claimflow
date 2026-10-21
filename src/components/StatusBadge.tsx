import type { ClaimStatus } from "../types";

const labels: Record<ClaimStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  REIMBURSED: "Reimbursed",
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{labels[status]}</span>;
}
