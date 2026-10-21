import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/dashboard" className="brand">
          ClaimFlow
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/claims">Claims</NavLink>
          {user?.role === "EMPLOYEE" && (
            <NavLink to="/claims/new">New claim</NavLink>
          )}
        </nav>
        <div className="user-bar">
          <span>
            {user?.displayName}{" "}
            <span className="role-pill">{user?.role}</span>
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        Workshop demo — credentials on the login page
      </footer>
    </div>
  );
}
