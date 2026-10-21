import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page-center">
      <h1>Page not found</h1>
      <p className="muted">The page you requested does not exist.</p>
      <Link to="/dashboard">Go to dashboard</Link>
    </div>
  );
}
