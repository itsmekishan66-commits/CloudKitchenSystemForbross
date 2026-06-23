"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import AuthForm from "./AuthForm";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [siteName, setSiteName] = useState("Cloud Kitchen");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create Account"}</h2>
        <p className="text-gray-500 mt-1">
          {mode === "login" ? `Welcome back to ${siteName}` : `Join ${siteName} today`}
        </p>

        <div className="mt-6">
          <AuthForm mode={mode} role="customer" onSuccess={onClose} />
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-red-900 font-semibold hover:underline"
          >
            {mode === "login" ? "Create now" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
