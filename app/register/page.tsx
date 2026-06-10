import Link from "next/link";

import AuthForm from "../auth/AuthForm";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="mt-2 text-gray-600">Save your profile and track orders.</p>
        <div className="mt-6">
          <AuthForm mode="register" role="customer" />
        </div>
        <p className="mt-5 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-red-900">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
