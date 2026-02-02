// src/components/Layout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./Layout.css";

import logo from "../assets/fonestore.png"; // <-- adjust path as needed

// Add "/accessories" as a base exception
const HEADER_EXCEPTIONS = ["/brands", "/mobiles", "/accessories"];

function isExceptionPath(pathname) {
  // exact matches
  if (HEADER_EXCEPTIONS.includes(pathname)) return true;

  // any nested brands route
  if (pathname.startsWith("/brands")) return true;

  // any nested accessories route (Accessories + Acctypes pages)
  if (pathname.startsWith("/accessories")) return true;

  return false;
}

export default function Layout() {
  const location = useLocation();
  const hideHeader = isExceptionPath(location.pathname);

  return (
    <div className="app-layout">
      {!hideHeader && (
        <>
          <div className="top-info-bar layout-top">
            <div className="top-left">Phone for Special one</div>
            <div className="top-right">
              INNOVATION | ENTERTAINMENT | SUSTAINABILITY
            </div>
          </div>

          <header className="imagine-bar layout-imagine">
            <div className="imagine-left">
              <img src={logo} alt="Imagine Logo" className="imagine-logo" />
            </div>

            <div className="imagine-right">Let’s be the change</div>
          </header>
        </>
      )}

      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
