// src/components/PopupModal.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./PopupModal.css";

export default function PopupModal({ open, onClose, onSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username, password });

      // ONLY call onSuccess. Do NOT call onClose here.
      // Parent's onSuccess should handle closing the modal and any follow-up action.
      onSuccess && onSuccess();

      setLoading(false);
      // do NOT call onClose() here — that caused the unwanted navigation
    } catch (err) {
      setLoading(false);
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="popup-backdrop">
      <div className="popup-container">
        <h3 className="popup-title">Sign In</h3>

        <form onSubmit={handleSubmit}>
          <div className="popup-field">
            <label>Username</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="popup-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="popup-error">{error}</div>}

          <div className="popup-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
