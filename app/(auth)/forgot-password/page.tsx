"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
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
              FORGOT PASSWORD
            </h2>
            <p className="text-gray-300 mt-2">
              {sent
                ? "Check your email for the reset link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="w-full max-w-md mx-auto">
            {sent ? (
              <div className="text-center space-y-6">
                <p className="text-gray-300">
                  If an account exists with that email, we&apos;ve sent a password
                  reset link.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-xl bg-red-900 py-3 px-8 text-white hover:bg-red-800"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="w-full text-white rounded-xl border p-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-red-900 py-3 text-white disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
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