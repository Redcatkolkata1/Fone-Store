// src/components/ServiceInventory.jsx

import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import IPreview from "./Servicebase/IPreview";          // Import Page
import "./ServiceInventory.css";

export default function mobInventory({ sidebarWidth = 64 }) {

  const [openPreview, setOpenPreview] = useState(false);

  return (
    <div
      className="serinv-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <div className="serinv-container">
        <section className="serinv-summary-box">

          {/* HEADER + ADD BUTTON */}
          <div className="serinv-summary-header header-flex">
            <span>Summary</span>

            <button className="add-btn" onClick={() => setOpenPreview(true)}>
              + Add
            </button>
          </div>

          {/* TABS */}
          <div className="serinv-tabs-row">
            <nav className="serinv-tabs">
              <NavLink to="inprocess" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                IN PROCESS
              </NavLink>

              <NavLink to="serviceready" className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
                READY
              </NavLink>
            </nav>
          </div>

          <div className="serinv-underline"/>

          <div className="serinv-body">
            <Outlet />
          </div>
        </section>
      </div>

      {/* POPUP MODAL */}
      {openPreview && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-btn" onClick={() => setOpenPreview(false)}>X</button>
            
            <IPreview />  {/* Display IPreview page inside popup */}
          </div>
        </div>
      )}
    </div>
  );
}
