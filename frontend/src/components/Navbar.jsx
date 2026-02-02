// src/components/Navbar.jsx
import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { FaBars, FaTimes, FaExchangeAlt, FaSignOutAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo1 from "../assets/logo1.png";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) setIsInventoryOpen(false);
  };

  const toggleInventory = () => {
    if (isOpen) setIsInventoryOpen((prev) => !prev);
  };

  // Logout
  const handleLogout = () => {
    logout();
    // Optional: you can navigate to "/" instead of "/login"
    navigate("/", { replace: true });
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      {/* LOGO */}
      <div className="logo-section">
        <img src={logo1} alt="Logo" className="logo" />
        {isOpen && <h1 className="brand">RedCat</h1>}
      </div>

      {/* Toggle */}
      <div className="collapse-btn-wrapper" onClick={toggleSidebar}>
        {isOpen ? (
          <>
            <FaTimes className="toggle-icon" />
            <span className="collapse-label">Collapse</span>
          </>
        ) : (
          <FaBars className="toggle-icon" />
        )}
      </div>

      {/* MENU */}
      <ul className="menu">
        {/* Dashboard (OPEN) */}
        <li className="menu-item">
          <NavLink to="/" className="menu-link">
            <DashboardIcon className="menu-icon" />
            {isOpen && <span className="menu-text">Dashboard</span>}
          </NavLink>
        </li>

        {/* Inventory */}
        <li
          className={`menu-item inventory-item ${
            isInventoryOpen ? "inventory-open" : ""
          }`}
          onClick={toggleInventory}
        >
          <div className="inventory-main">
            <InventoryIcon className="menu-icon" />
            {isOpen && <span className="menu-text">Inventory</span>}
          </div>
          {isOpen && (
            <span className="inventory-arrow">
              {isInventoryOpen ? "▾" : ""}
            </span>
          )}
        </li>

        {isOpen && isInventoryOpen && (
          <ul className="submenu">
            {/* These pages are Protected by RequireAuth in App.jsx */}
            <li
              className="submenu-item"
              onClick={() => navigate("/addinventory")}
            >
              Add Inventory
            </li>
            <li
              className="submenu-item"
              onClick={() => navigate("/accinventory")}
            >
              Accessory Inventory
            </li>
            <li
              className="submenu-item"
              onClick={() => navigate("/mobileinventory")}
            >
              Mobile Inventory
            </li>
            <li
              className="submenu-item"
              onClick={() => navigate("/serviceinventory")}
            >
              Service Inventory
            </li>
          </ul>
        )}

        {/* Transactions (Protected by RequireAuth) */}
        <li className="menu-item">
          <div className="menu-link" onClick={() => navigate("/transactions")}>
            <FaExchangeAlt className="menu-icon" />
            {isOpen && <span className="menu-text">Transactions</span>}
          </div>
        </li>

        {/* Billing (OPEN - no auth) */}
        <li className="menu-item">
          <NavLink to="/billing" className="menu-link">
            <ReceiptLongIcon className="menu-icon" />
            {isOpen && <span className="menu-text">Billing</span>}
          </NavLink>
        </li>
      </ul>

      {/* Logout */}
      <div className="bottom-section">
        <div className="menu-link bottom-item" onClick={handleLogout}>
          <FaSignOutAlt className="menu-icon" />
          {isOpen && <span className="menu-text">Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
