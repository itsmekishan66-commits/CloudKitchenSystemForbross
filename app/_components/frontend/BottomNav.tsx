"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Info, Utensils, Phone, LayoutDashboard, LogOut, LogIn } from "lucide-react";
import useUser from "../../../hooks/useUser";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Info },
  { name: "Menu", href: "/menu", icon: Utensils },
  { name: "Contact", href: "/contact", icon: Phone },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await signOut({ redirect: false });
    toast.success("Logged out successfully");
    setTimeout(() => router.push("/login"), 400);
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-t border-white/10 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? "text-orange-400" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Auth */}
        {loading ? null : user ? (
          <>
            <Link
              href="/user/dashboard"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive("/user/dashboard") ? "text-orange-400" : "text-white/60 hover:text-white"
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-medium">Logout</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <LogIn size={20} />
            <span className="text-[10px] font-medium">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}