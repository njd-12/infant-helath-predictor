import { Link, useNavigate } from "react-router-dom";
import { Activity, LogOut, User, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          <Activity size={22} />
          InfantCare AI
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4">
          {!auth ? (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Patient Login
              </Link>
              <Link
                to="/doctor/login"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
              >
                <Stethoscope size={14} />
                Doctor Login
              </Link>
            </>
          ) : auth.user.role === "doctor" ? (
            <>
              <Link
                to="/doctor/dashboard"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Stethoscope size={16} className="text-blue-500" />
                Dr. {auth.user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/my-reports"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
              >
                My Reports
              </Link>
              <Link
                to="/my-consultations"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Consultations
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={16} className="text-blue-500" />
                {auth.user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
