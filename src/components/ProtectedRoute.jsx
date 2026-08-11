import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users can access it.
 *
 * Admin routes:
 *   <ProtectedRoute adminOnly>
 *     <Admin />
 *   </ProtectedRoute>
 *
 * Normal protected routes:
 *   <ProtectedRoute>
 *     <Cart />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useContext(AuthContext);

  const location = useLocation();

  // --------------------------------------------------
  // 1. Wait until authentication has been restored
  // --------------------------------------------------
  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );
  }

  // --------------------------------------------------
  // 2. User is not authenticated
  // --------------------------------------------------
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --------------------------------------------------
  // 3. Admin route but user is not an admin
  // --------------------------------------------------
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // --------------------------------------------------
  // 4. Authentication and permissions are valid
  // --------------------------------------------------
  return children;
}
