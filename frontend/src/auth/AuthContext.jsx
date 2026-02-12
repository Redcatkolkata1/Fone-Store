// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider: simple in-memory auth for demonstration.
 * Replace login() with your API call and implement proper token handling & persistence.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Optional: persist session in localStorage (demo)
  useEffect(() => {
    const saved = localStorage.getItem("rc_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("rc_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("rc_user");
    }
  }, [user]);

  const login = async ({ username, password }) => {
    // DEMO: accept username=admin password=password
    // Replace with actual API call + error handling
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "admin@123" && password === "fs@123#") {
          const userObj = { username };
          setUser(userObj);
          resolve(userObj);
        } else {
          reject(new Error("Invalid username or password"));
        }
      }, 300);
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
