import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users can access it.
 * Unauthenticated users are redirected to /login, with the
 * current path saved so they can be sent back after login.
 *
 * Usage:
 *   <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
 *   <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Wait for auth state to be restored from localStorage
  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
