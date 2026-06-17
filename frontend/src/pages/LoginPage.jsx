import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ name: "", email: "", password: "", phone: "" });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = isRegister
        ? await registerUser({ name: form.name, email: form.email, password: form.password, phone: form.phone })
        : await loginUser({ email: form.email, password: form.password });

      if (res.token) {
        login(res);
        navigate("/");
      } else {
        setError(res.message || "Something went wrong");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 text-blue-600 mb-6">
          <Activity size={26} />
          <span className="text-xl font-bold">InfantCare AI</span>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
          {isRegister ? "Create Patient Account" : "Patient Login"}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {isRegister ? "Register to save reports and consult doctors" : "Access your health records and consultations"}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {isRegister && (
            <input name="name" placeholder="Full Name" required
              className="input" value={form.name} onChange={handle} />
          )}
          <input name="email" type="email" placeholder="Email address" required
            className="input" value={form.email} onChange={handle} />
          {isRegister && (
            <input name="phone" placeholder="Phone (optional)"
              className="input" value={form.phone} onChange={handle} />
          )}
          <div className="relative">
            <input name="password" type={showPwd ? "text" : "password"}
              placeholder="Password" required minLength={6}
              className="input pr-10" value={form.password} onChange={handle} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-blue-600 font-medium hover:underline">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        <div className="border-t mt-5 pt-4 text-center">
          <Link to="/doctor/login" className="text-sm text-gray-500 hover:text-blue-600">
            Are you a doctor? Login here →
          </Link>
        </div>
      </div>
    </div>
  );
}
