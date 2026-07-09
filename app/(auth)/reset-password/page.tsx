"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      toast.error("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="relative w-full max-w-screen h-screen overflow-hidden shadow-2xl">
        <div className="flex items-center justify-center h-full">
          <img
            src="/hero1.jpg"
            alt="Background"
            className="absolute inset-0 h-full w-full object-fit"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center text-white space-y-4">
            <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
            <p className="text-gray-300">This reset link is missing or invalid.</p>
            <Link
              href="/forgot-password"
              className="inline-block rounded-xl bg-red-900 py-3 px-8 text-white hover:bg-red-800"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-full max-w-screen h-screen overflow-hidden shadow-2xl">
      <div className="flex items-center justify-center h-full">
        <img
          src="/hero1.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-fit"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative h-full w-full md:w-[75%] lg:w-[55%] mx-auto backdrop-blur-xl bg-black/20 border-x border-white/10 flex flex-col justify-center px-6 sm:px-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-8">
              RESET PASSWORD
            </h2>
            <p className="text-gray-300 mt-2">
              {done ? "Password reset successful!" : "Enter your new password"}
            </p>
          </div>

          <div className="w-full max-w-md mx-auto">
            {done ? (
              <div className="text-center space-y-6">
                <p className="text-gray-300">
                  Your password has been updated. Redirecting to login...
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-xl bg-red-900 py-3 px-8 text-white hover:bg-red-800"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    minLength={8}
                    className="w-full text-white rounded-xl border p-3 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <input
                  required
                  type="password"
                  placeholder="Confirm new password"
                  minLength={8}
                  className="w-full text-white rounded-xl border p-3"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-red-900 py-3 text-white disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <p className="flex justify-center items-center mt-6 text-sm text-gray-300">
                  Remember your password?
                  <Link
                    href="/login"
                    className="ml-2 text-orange-400 hover:text-orange-300 underline"
                  >
                    Back to Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}