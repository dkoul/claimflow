import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { api, ApiError } from "../services/api";
import type { Claim } from "../types";
import { formatInr, formatDate } from "../utils/format";

export function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const d = await api.dashboard();
        setData(d);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="muted">Loading dashboard…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const role = data.role as string;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {role === "EMPLOYEE" && (
        <>
          <div className="stat-grid">
            <StatCard label="Draft claims" value={String((data.stats as { draftCount: number }).draftCount)} />
            <StatCard label="Pending" value={String((data.stats as { pendingCount: number }).pendingCount)} />
            <StatCard label="Rejected" value={String((data.stats as { rejectedCount: number }).rejectedCount)} />
            <StatCard
              label="Approved / reimbursed total"
              value={formatInr((data.stats as { approvedTotal: number }).approvedTotal)}
            />
          </div>
          <ClaimTable title="Recent claims" claims={data.recentClaims as Claim[]} />
        </>
      )}

      {role === "MANAGER" && (
        <>
          <div className="stat-grid">
            <StatCard label="Pending review" value={String((data.stats as { pendingCount: number }).pendingCount)} />
            <StatCard
              label="Pending value"
              value={formatInr((data.stats as { pendingTotal: number }).pendingTotal)}
            />
          </div>
          <ClaimTable title="Pending claims" claims={data.pendingClaims as Claim[]} />
          <ClaimTable title="Recently reviewed" claims={data.recentlyReviewed as Claim[]} />
        </>
      )}

      {role === "FINANCE" && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Awaiting reimbursement"
              value={String((data.stats as { awaitingCount: number }).awaitingCount)}
            />
            <StatCard
              label="Awaiting amount"
              value={formatInr((data.stats as { awaitingTotal: number }).awaitingTotal)}
            />
            <StatCard
              label="Total reimbursed"
              value={formatInr((data.stats as { reimbursedTotal: number }).reimbursedTotal)}
            />
          </div>
          <ClaimTable title="Approved — awaiting reimbursement" claims={data.awaitingReimbursement as Claim[]} />
          <ClaimTable title="Recently processed" claims={data.recentlyProcessed as Claim[]} />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function ClaimTable({ title, claims }: { title: string; claims: Claim[] }) {
  if (!claims?.length) {
    return (
      <section className="section">
        <h2>{title}</h2>
        <p className="muted empty">No claims to show.</p>
      </section>
    );
  }

  return (
    <section className="section">
      <h2>{title}</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id}>
              <td><Link to={`/claims/${c.id}`}>{c.id}</Link></td>
              <td>{c.title}</td>
              <td>{formatInr(c.amount)}</td>
              <td><StatusBadge status={c.status} /></td>
              <td>{formatDate(c.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
