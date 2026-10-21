import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../features/auth/AuthContext";
import { api, ApiError } from "../services/api";
import type { Category, Claim, ClaimStatus } from "../types";
import { formatDate, formatInr } from "../utils/format";

const STATUSES: ClaimStatus[] = [
  "DRAFT",
  "PENDING",
  "REJECTED",
  "APPROVED",
  "REIMBURSED",
];

export function ClaimsListPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.categories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      params.set("sort", sort);
      params.set("sortDir", sortDir);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      try {
        const res = await api.listClaims(params);
        setClaims(res.items);
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load claims");
      } finally {
        setLoading(false);
      }
    })();
  }, [search, status, category, sort, sortDir, page, pageSize]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Claims</h1>
        {user?.role === "EMPLOYEE" && (
          <Link className="btn btn-primary" to="/claims/new">New claim</Link>
        )}
      </div>

      <div className="filters">
        <label>
          Search
          <input
            placeholder="ID or title"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={`${sort}-${sortDir}`}
            onChange={(e) => {
              const [s, d] = e.target.value.split("-");
              setSort(s);
              setSortDir(d as "asc" | "desc");
            }}
          >
            <option value="updatedAt-desc">Last updated (newest)</option>
            <option value="updatedAt-asc">Last updated (oldest)</option>
            <option value="expenseDate-desc">Expense date (newest)</option>
            <option value="expenseDate-asc">Expense date (oldest)</option>
            <option value="amount-desc">Amount (high)</option>
            <option value="amount-asc">Amount (low)</option>
          </select>
        </label>
        <label>
          Page size
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="muted">Loading claims…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && claims.length === 0 && (
        <p className="muted empty">No claims match your filters.</p>
      )}

      {!loading && claims.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/claims/${c.id}`}>{c.id}</Link></td>
                <td>{c.employeeName}</td>
                <td>{c.title}</td>
                <td>{c.category}</td>
                <td>{c.expenseDate}</td>
                <td>{formatInr(c.amount)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td>{formatDate(c.updatedAt)}</td>
                <td className="actions-cell">
                  <Link to={`/claims/${c.id}`}>View</Link>
                  {user?.role === "EMPLOYEE" &&
                    c.employeeId === user.id &&
                    (c.status === "DRAFT" || c.status === "REJECTED") && (
                      <>
                        {" · "}
                        <Link to={`/claims/${c.id}/edit`}>Edit</Link>
                      </>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {total > 0 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pageCount} ({total} total)
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
