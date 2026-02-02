// src/components/Login.jsx  (or src/pages/Login.jsx)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import fsLogo from "../assets/fonestore.png";
import lockImg from "../assets/lock.png";
import redcat from "../assets/redcat.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // TEMP: hardcoded credentials for testing
  const VALID_USER = "admin";
  const VALID_PASS = "1234";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === VALID_USER && password === VALID_PASS) {
      // mark user as logged in
      localStorage.setItem("isAuthenticated", "true");

      // clear any previous error
      setError("");

      // go to dashboard/home
      navigate("/");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* LEFT IMAGE */}
        <div className="left-section">
          <img src={lockImg} className="lock-img" alt="Security Lock" />
        </div>

        {/* RIGHT FORM */}
        <div className="right-section">
          <div className="brand-head">
            <img src={redcat} className="redcat-logo" alt="RedCat Logo" />
            <h2 className="brand-title">Phone for Special one</h2>
          </div>

          <img src={fsLogo} className="fs-logo" alt="Imagine Logo" />
          <p className="subtext">Let’s be the change</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>User Name</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
