import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// role = "user" | "doctor" | undefined (any logged-in)
export default function ProtectedRoute({ children, role }) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) {
    return <Navigate to={auth.user.role === "doctor" ? "/doctor/dashboard" : "/"} replace />;
  }
  return children;
}
