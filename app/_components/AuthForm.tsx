"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
  role?: "admin" | "customer";
  onSuccess?: () => void;
};

export default function AuthForm({ mode, role = "customer", onSuccess }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otp0 = useRef<HTMLInputElement>(null);
  const otp1 = useRef<HTMLInputElement>(null);
  const otp2 = useRef<HTMLInputElement>(null);
  const otp3 = useRef<HTMLInputElement>(null);
  const otp4 = useRef<HTMLInputElement>(null);
  const otp5 = useRef<HTMLInputElement>(null);
  const otpRefs = [otp0, otp1, otp2, otp3, otp4, otp5];
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
          toast.error(data.error ?? "Registration failed");
          setError(data.error ?? "Registration failed");
          return;
        }

        if (data.requiresOtp) {
          toast.success("Verification code sent to your email");
          setStep("otp");
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
        toast.error("Invalid email or password");
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

  async function handleOtpVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.toLowerCase().trim(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Verification failed");
        setError(data.error ?? "Verification failed");
        return;
      }
      toast.success("Email verified! Now login with your registered email to get inside our Cloud Kitchen");
      setTimeout(() => router.push("/login"), 400);
    } catch {
      setError("Unable to verify code");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  }

  if (step === "otp") {
    return (
      <div className="space-y-6">
        <div className="text-center text-white">
          <p className="text-sm text-gray-300 mb-1">Verification code sent to</p>
          <p className="font-medium">{form.email}</p>
        </div>

        <div className="flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={otpRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="w-10 h-12 text-center text-lg font-bold text-white rounded-xl border bg-transparent focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          ))}
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 text-center">{error}</p>
        ) : null}

        <button
          onClick={handleOtpVerify}
          disabled={loading}
          className="w-full rounded-xl bg-red-900 py-3 text-white disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </div>
    );
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

      <div className="relative">
        <input
          required
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          minLength={8}
          className="w-full text-white rounded-xl border p-3 pr-10"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

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
