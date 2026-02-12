// src/App.jsx

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import Home from "./components/Home";

import Mobiles from "./components/Mobiles";
import Accessories from "./components/Accessories";
import Acctypes from "./components/Acctypes";
import BrandPage from "./components/BrandPage";
import ModelPage from "./components/ModelPage";

import AddInventory from "./components/AddInventory";

import AccInventory from "./components/AccInventory";
import ReadyAcc from "./components/Accessorybase/ReadyAcc";
import SoldAcc from "./components/Accessorybase/SoldAcc";
import TFBAcc from "./components/Accessorybase/TFBAcc";

import MobileInventory from "./components/MobileInventory";
import ServiceInventory from "./components/ServiceInventory";

import ReadyMobile from "./components/Mobilebase/ReadyMobile";
import SoldMobile from "./components/Mobilebase/SoldMobile";
import TFBMobile from "./components/Mobilebase/TFBMobile";

import InProcess from "./components/Servicebase/InProcess";
import ServiceReady from "./components/Servicebase/ServiceReady";
import IPreview from "./components/Servicebase/IPreview";

import Transactions from "./components/Transactions";
import Billing from "./components/Billing";
import Bill from "./components/Bill";

// Login page (keep it)
import Login from "./components/Login";

// Providers
import { StockProvider } from "./components/StockContext";
import { AuthProvider } from "./auth/AuthContext";

// Popup Auth wrapper
import RequireAuth from "./auth/RequireAuth";

const App = () => {
  const location = useLocation();

  return (
    <AuthProvider>
      <StockProvider>
        {/* Hide Navbar on Login page */}
        {location.pathname !== "/login" && <Navbar />}

        <Routes>
          {/* ✅ Root should NOT redirect to login */}
          <Route path="/" element={<Layout />}>
            {/* ✅ Home does NOT require popup */}
            <Route index element={<Home />} />

            {/* ✅ Protected Pages => Popup Modal */}
            <Route
              path="mobiles"
              element={
                <RequireAuth>
                  <Mobiles />
                </RequireAuth>
              }
            />

            <Route
              path="accessories"
              element={
                <RequireAuth>
                  <Accessories />
                </RequireAuth>
              }
            />

            <Route
              path="accessories/:accessoryId"
              element={
                <RequireAuth>
                  <Acctypes />
                </RequireAuth>
              }
            />

            <Route
              path="brands/:brandName"
              element={
                <RequireAuth>
                  <BrandPage />
                </RequireAuth>
              }
            />

            <Route
              path="brands/:brandName/:modelName"
              element={
                <RequireAuth>
                  <ModelPage />
                </RequireAuth>
              }
            />

            <Route
              path="addinventory"
              element={
                <RequireAuth>
                  <AddInventory />
                </RequireAuth>
              }
            />

            {/* === ACCESSORY INVENTORY + TABS === */}
            <Route
              path="accinventory"
              element={
                <RequireAuth>
                  <AccInventory />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="readyacc" replace />} />
              <Route path="readyacc" element={<ReadyAcc />} />
              <Route path="soldacc" element={<SoldAcc />} />
              <Route path="tfbacc" element={<TFBAcc />} />
            </Route>

            {/* === MOBILE INVENTORY + TABS === */}
            <Route
              path="mobileinventory"
              element={
                <RequireAuth>
                  <MobileInventory />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="readymob" replace />} />
              <Route path="readymob" element={<ReadyMobile />} />
              <Route path="soldmob" element={<SoldMobile />} />
              <Route path="tfbmob" element={<TFBMobile />} />
            </Route>

            {/* === SERVICE INVENTORY + TABS === */}
            <Route
              path="serviceinventory"
              element={
                <RequireAuth>
                  <ServiceInventory />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="inprocess" replace />} />
              <Route path="inprocess" element={<InProcess />} />
              <Route path="serviceready" element={<ServiceReady />} />
            </Route>

            <Route
              path="ipreview"
              element={
                <RequireAuth>
                  <IPreview />
                </RequireAuth>
              }
            />

            {/* ✅ Transactions should require popup */}
            <Route
              path="transactions"
              element={
                <RequireAuth>
                  <Transactions />
                </RequireAuth>
              }
            />

            {/* ✅ Billing should NOT require popup */}
            <Route path="billing" element={<Billing />} />

            {/* Bill page (optional protect) */}
            <Route
              path="bill"
              element={
                <RequireAuth>
                  <Bill />
                </RequireAuth>
              }
            />
          </Route>

          {/* ✅ login page standalone */}
          <Route path="/login" element={<Login />} />
        </Routes>
      </StockProvider>
    </AuthProvider>
  );
};

export default App;
