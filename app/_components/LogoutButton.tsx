"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut({ redirect: false });
    toast.success("You have been logged out successfully!");
    setTimeout(() => router.push("/login"), 400);
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
