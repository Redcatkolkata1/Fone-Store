// src/auth/RequireAuth.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import PopupModal from "../components/PopupModal";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * RequireAuth (improved)
 *
 * - Captures the requested path when the modal opens.
 * - On success: sets per-path session flag, closes modal, and navigates (replace) to the requested path.
 * - On cancel: navigates back (or to "/" if no history).
 *
 * This guarantees that after a successful sign-in the app ends up on the exact page the user attempted to open.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Ref to remember the path the user wanted when we opened the modal
  const requestedPathRef = useRef(pathname);
  const sessionKey = `auth_prompt:${pathname}`;

  useEffect(() => {
    const alreadyAuthorized = !!sessionStorage.getItem(sessionKey);

    if (!alreadyAuthorized) {
      // Save the path the user is trying to reach right now
      requestedPathRef.current = pathname;

      // open modal (deferred to avoid state update during render)
      setTimeout(() => setOpen(true), 0);
    } else {
      setOpen(false);
    }
    // Intentionally only depend on pathname
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cancel: navigate back if possible; otherwise go to "/"
  const handleClose = () => {
    // do NOT setOpen(false) before navigating (we will unmount this component soon)
    // Prefer going back in history; fallback to home
    try {
      navigate(-1);
    } catch (err) {
      navigate("/", { replace: true });
    }
  };

  // Success: set session flag, close modal and explicitly navigate to the requested path.
  const handleSuccess = () => {
    try {
      // mark this specific path authorized for this session/tab
      sessionStorage.setItem(`auth_prompt:${requestedPathRef.current}`, "1");
    } catch (err) {
      // ignore storage errors
    }

    // Ensure we end up on the path the user intended (replace so history doesn't bounce)
    const dest = requestedPathRef.current || pathname || "/";
    navigate(dest, { replace: true });

    // Close modal after navigation call
    setOpen(false);
  };


  // Block rendering of protected content while modal is open
  return (
    <>
      <PopupModal open={open} onClose={handleClose} onSuccess={handleSuccess} />
      {!open && children}
    </>
  );
}
