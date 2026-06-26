"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type AuthFormProps = {
  mode: "login" | "register";
  role?: "admin" | "customer";
  onSuccess?: () => void;
};

export default function AuthForm({ mode, role = "customer", onSuccess }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    inviteCode: "",
  });

  const isRegister = mode === "register";
  const isAdmin = role === "admin";

    function getRedirectPath(userRole: string) {
      const adminRoles = ["super-admin", "admin", "staff", "kitchen-manager", "payment-manager", "support-staff"];
      if (adminRoles.includes(userRole)) {
        return "/dashboard";
      }
      return "/user/dashboard";
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role }),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Registration failed");
          return;
        }

        toast.success("Account created successfully! Please sign in.");
        setTimeout(() => router.push("/login"), 300);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      const session = await getSession();
      const redirectPath = getRedirectPath(session?.user?.role ?? "customer");

      toast.success("Logged in successfully!");

      if (onSuccess) {
        onSuccess();
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister ? (
        <input
          required
          placeholder="Full name"
          className="w-full text-white rounded-xl border p-3"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      ) : null}

      <input
        required
        type="email"
        placeholder="Email"
        className="w-full text-white rounded-xl border p-3"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />

      <input
        required
        type="password"
        placeholder="Password"
        minLength={8}
        className="w-full text-white rounded-xl border p-3"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />

      {isRegister ? (
        <>
          <input
            placeholder="Phone"
            className="w-full text-white rounded-xl border p-3"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />

          <textarea
            placeholder="Address"
            className="w-full text-white rounded-xl border p-3"
            rows={3}
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
            }
          />
        </>
      ) : null}

      {isRegister && isAdmin ? (
        <input
          required
          placeholder="Admin invite code"
          className="w-full rounded-xl border p-3"
          value={form.inviteCode}
          onChange={(event) =>
            setForm({ ...form, inviteCode: event.target.value })
          }
        />
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-red-900 py-3 text-white disabled:opacity-60"
      >
        {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
      </button>
    </form>
  );
}
