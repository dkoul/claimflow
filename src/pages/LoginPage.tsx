import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ApiError } from "../services/api";

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>ClaimFlow</h1>
        <p className="muted">Expense reimbursement workshop demo</p>

        <form onSubmit={onSubmit} className="login-form">
          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}
          <label>
            Username
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </label>
          <button type="submit" className="btn btn-primary full-width" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demo-creds" aria-label="Demo credentials">
          <p><strong>Demo users</strong> (password for all: <code>demo123</code>)</p>
          <ul>
            <li><code>alice</code> — Employee</li>
            <li><code>bob</code> — Manager</li>
            <li><code>carol</code> — Finance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
