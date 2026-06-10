import Link from "next/link";

import AuthForm from "../auth/AuthForm";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="mt-2 text-gray-600">Access your Mama&apos;s Kitchen account.</p>
        <div className="mt-6">
          <AuthForm mode="login" role="customer" />
        </div>
        <div className="mt-5 flex justify-between text-sm">
          <Link href="/register" className="text-red-900">
            Create account
          </Link>
          <Link href="/admin/login" className="text-red-900">
            Admin login
          </Link>
        </div>
      </div>
    </main>
  );
}
