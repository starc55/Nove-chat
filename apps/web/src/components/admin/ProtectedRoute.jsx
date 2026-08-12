import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ADMIN_BASE } from "../../config/admin.js";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="admin-auth-loading"><span>N</span><p>Sessiya tekshirilmoqda</p></div>;
  if (!user) return <Navigate to={`${ADMIN_BASE}/sign-in`} replace state={{ from: location.pathname }} />;
  return children;
}
