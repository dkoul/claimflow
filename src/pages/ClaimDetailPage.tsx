import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../features/auth/AuthContext";
import { api, ApiError } from "../services/api";
import type { Claim } from "../types";
import { formatDate, formatInr } from "../utils/format";

export function ClaimDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { claim: c } = await api.getClaim(id);
      setClaim(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load claim");
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function runAction(fn: () => Promise<void>) {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">Loading claim…</p>;

  if (error || !claim) {
    return (
      <div className="page">
        <div className="alert alert-error">{error ?? "Claim not found"}</div>
        <Link to="/claims">Back to claims</Link>
      </div>
    );
  }

  const canEdit =
    user?.role === "EMPLOYEE" &&
    user.id === claim.employeeId &&
    (claim.status === "DRAFT" || claim.status === "REJECTED");

  const canSubmit =
    user?.role === "EMPLOYEE" &&
    user.id === claim.employeeId &&
    (claim.status === "DRAFT" || claim.status === "REJECTED");

  const canReview =
    user?.role === "MANAGER" &&
    claim.managerId === user.id &&
    claim.status === "PENDING";

  const canReimburse = user?.role === "FINANCE" && claim.status === "APPROVED";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{claim.title}</h1>
          <p className="muted">{claim.id} · <StatusBadge status={claim.status} /></p>
        </div>
        <Link className="btn btn-ghost" to="/claims">Back</Link>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      {claim.lastReviewComment && claim.status === "REJECTED" && (
        <div className="alert alert-warn">
          <strong>Rejection reason:</strong> {claim.lastReviewComment}
        </div>
      )}

      <div className="detail-grid">
        <section>
          <h2>Details</h2>
          <dl className="detail-list">
            <dt>Employee</dt>
            <dd>{claim.employeeName}</dd>
            <dt>Manager</dt>
            <dd>{claim.managerName}</dd>
            <dt>Category</dt>
            <dd>{claim.category}</dd>
            <dt>Expense date</dt>
            <dd>{claim.expenseDate}</dd>
            <dt>Amount</dt>
            <dd>{formatInr(claim.amount)}</dd>
            <dt>Receipt</dt>
            <dd>{claim.receiptReference || "—"}</dd>
            <dt>Description</dt>
            <dd>{claim.description}</dd>
            <dt>Created</dt>
            <dd>{formatDate(claim.createdAt)}</dd>
            <dt>Last updated</dt>
            <dd>{formatDate(claim.updatedAt)} (v{claim.version})</dd>
          </dl>
        </section>

        <section>
          <h2>History</h2>
          <ol className="history-list">
            {claim.history.map((h, i) => (
              <li key={`${h.timestamp}-${i}`}>
                <span className="history-type">{h.type}</span>
                <span className="muted">{formatDate(h.timestamp)}</span>
                {h.comment && <p>{h.comment}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="action-bar">
        {canEdit && (
          <Link className="btn" to={`/claims/${claim.id}/edit`}>Edit</Link>
        )}
        {canSubmit && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await api.submitClaim(claim.id);
              })
            }
          >
            {claim.status === "REJECTED" ? "Resubmit" : "Submit for approval"}
          </button>
        )}

        {canReview && (
          <>
            <label className="inline-label">
              Approval comment
              <input
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await api.approveClaim(claim.id, approveComment);
                  setApproveComment("");
                })
              }
            >
              Approve
            </button>
            <label className="inline-label">
              Rejection reason <span className="req">*</span>
              <input
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy || !rejectReason.trim()}
              onClick={() =>
                runAction(async () => {
                  await api.rejectClaim(claim.id, rejectReason);
                  setRejectReason("");
                })
              }
            >
              Reject
            </button>
          </>
        )}

        {canReimburse && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await api.reimburseClaim(claim.id);
                navigate("/claims");
              })
            }
          >
            Mark reimbursed
          </button>
        )}
      </div>
    </div>
  );
}
