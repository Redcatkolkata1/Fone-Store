// src/components/StockContext.jsx
import React, { createContext, useCallback, useState } from "react";

export const StockContext = createContext({
  totalMobiles: 0,
  setTotalMobiles: () => { },
  totalAccessories: 0,
  setTotalAccessories: () => { },
  refreshMobileStock: async () => { },
  refreshAccessoryStock: async () => { },
  stockRefreshTrigger: 0, // ✅ Added default value for the trigger
});

export function StockProvider({ children }) {
  const [totalMobiles, setTotalMobiles] = useState(0);
  const [totalAccessories, setTotalAccessories] = useState(0);

  // ✅ 1. New State: A counter that increments whenever stock is refreshed
  const [stockRefreshTrigger, setStockRefreshTrigger] = useState(0);

  // helper to fetch a list safely
  // In src/components/StockContext.jsx

  // Update this helper function:
  const safeFetchList = async (url) => {
    // Add timestamp to prevent caching
    const separator = url.includes("?") ? "&" : "?";
    const freshUrl = `${url}${separator}t=${Date.now()}`;

    const res = await fetch(freshUrl);
    if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  // Mobiles in stock = status ready + tfb
  const refreshMobileStock = useCallback(async () => {
    try {
      const [ready, tfb] = await Promise.all([
        safeFetchList("http://localhost:5000/api/mobiles?status=ready"),
        safeFetchList("http://localhost:5000/api/mobiles?status=tfb"),
      ]);

      const list = [...ready, ...tfb];
      const total = list.length;
      setTotalMobiles(total);

      // ✅ 2. Signal Update: Increment trigger so TFBMobile knows to reload
      setStockRefreshTrigger((prev) => prev + 1);

      return total;
    } catch (err) {
      console.error("refreshMobileStock error:", err);
      setTotalMobiles(0);
      return 0;
    }
  }, []);

  // Accessories in stock = status ready + tfb
  const refreshAccessoryStock = useCallback(async () => {
    try {
      const [ready, tfb] = await Promise.all([
        safeFetchList("http://localhost:5000/api/accessories?status=ready"),
        safeFetchList("http://localhost:5000/api/accessories?status=tfb"),
      ]);

      const list = [...ready, ...tfb];
      const total = list.length;
      setTotalAccessories(total);

      // ✅ 3. Signal Update: Also trigger for accessories
      setStockRefreshTrigger((prev) => prev + 1);

      return total;
    } catch (err) {
      console.error("refreshAccessoryStock error:", err);
      setTotalAccessories(0);
      return 0;
    }
  }, []);

  return (
    <StockContext.Provider
      value={{
        totalMobiles,
        setTotalMobiles,
        totalAccessories,
        setTotalAccessories,
        refreshMobileStock,
        refreshAccessoryStock,
        stockRefreshTrigger, // ✅ 4. Expose the trigger
      }}
    >
      {children}
    </StockContext.Provider>
  );
}