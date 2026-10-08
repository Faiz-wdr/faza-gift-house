import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, AlertCircle, Eye, EyeOff, User } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect to admin if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { authService } = await import("../services/authService");
      const user = await authService.getCurrentUser();
      if (user) {
        navigate("/admin");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { authService } = await import("../services/authService");
      await authService.login(email, ...[password]);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="login-header">
          <h2 className="login-logo">
            Faza <span>Gift House</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email-field">Username</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="email-field"
                placeholder="Enter Username or Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label htmlFor="password-field">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password-field"
                className="password-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-green w-100 btn-login"
            id="login-submit-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
