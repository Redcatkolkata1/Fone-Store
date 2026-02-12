// src/components/AccInventory.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AccInventory.css";

export default function AccInventory({ sidebarWidth = 64 }) {

  return (
    <div
      className="accinv-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <div className="accinv-container">
        <section className="accinv-summary-box">
          <div className="accinv-summary-header">Summary</div>

          <div className="accinv-tabs-row">
            <nav className="accinv-tabs">
              <NavLink to="readyacc" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                READY
              </NavLink>

              <NavLink to="soldacc" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                SOLD
              </NavLink>

              <NavLink to="tfbacc" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                TRANSFERRED FOR BILLING
              </NavLink>
            </nav>
          </div>

          <div className="accinv-underline" />

          <div className="accinv-body">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
