import React from "react";
import { useNavigate } from "react-router-dom";
import "./LogoutButton.css";

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 🔹 If you want to call your MongoDB / backend API, do it here:
    // try {
    //   await fetch("/api/logout", { method: "POST", credentials: "include" });
    // } catch (err) {
    //   console.error("Logout API error:", err);
    // }

    // 🔹 Clear any client-side auth data (tokens, user info, etc.)
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Optional: callback to let parent know logout happened
    if (typeof onLogout === "function") {
      onLogout();
    }

    // 🔹 Redirect to login / landing page
    navigate("/");
  };

  return (
    <button className="logout-btn" type="button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;
