"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Width of the drawer. Defaults to "600px". Use "800px" for wide forms. */
  width?: string;
}

/**
 * Slide-in drawer from the right side.
 * Drop-in replacement for a centered modal — wraps any children (e.g. your
 * existing <Modal> form content) without touching scroll position.
 */
export function Drawer({ open, onClose, title, children, width = "600px" }: DrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width, maxWidth: "100vw" }}
        className={`fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Scrollable body — your existing Modal renders here */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}