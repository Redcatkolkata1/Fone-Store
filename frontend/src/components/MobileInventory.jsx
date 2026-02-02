// src/components/MobileInventory.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./MobileInventory.css";

export default function mobInventory({ sidebarWidth = 64 }) {

  return (
    <div
      className="mobinv-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <div className="mobinv-container">
        <section className="mobinv-summary-box">
          <div className="mobinv-summary-header">Summary</div>

          <div className="mobinv-tabs-row">
            <nav className="mobinv-tabs">
              <NavLink to="readymob" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                READY
              </NavLink>

              <NavLink to="soldmob" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                SOLD
              </NavLink>

              <NavLink to="tfbmob" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                TRANSFERRED FOR BILLING
              </NavLink>
            </nav>
          </div>

          <div className="mobinv-underline" />

          <div className="mobinv-body">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
