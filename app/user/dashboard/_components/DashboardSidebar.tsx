"use client";

import {LayoutDashboard,ShoppingCart,Heart,CreditCard,Bell,User,LogOut,Menu,X,ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteName, setSiteName] = useState("Cloud Kitchen");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/user/dashboard" },
    { name: "Orders", icon: ShoppingCart, href: "/user/dashboard/order" },
    { name: "Favorites", icon: Heart, href: "/user/dashboard/favorites" },
    { name: "Payments", icon: CreditCard, href: "/user/dashboard/payments" },
    { name: "Notifications", icon: Bell, href: "/user/dashboard/notifications" },
    { name: "Profile", icon: User, href: "/user/dashboard/profile" },
    { name: "Back to Home", icon: ArrowLeft, href: "/" },
  ];

  const sidebarContent = (
    <div className="flex gap-4 flex-col h-full w-full">
      <div className="p-6 border-b border-gray-100">
        <Link href="/user/dashboard">
          <h2 className="text-2xl font-bold bg-linear-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            {siteName}
          </h2>
        </Link>
        <p className="text-xs text-gray-400 mt-1">User Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = pathname === menu.href;

          return (
            <Link
              href={menu.href}
              key={menu.href}
              onClick={() => setMobileOpen(false)}
            >
              <div
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${isActive
                    ? "bg-orange-300 text-black shadow-md shadow-orange-100 scale-[1.02]"
                    : "text-black hover:bg-orange-50 hover:text-orange-600"
                  }`}
              >
                <Icon size={20} />
                <span>{menu.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            toast.success("You have been logged out successfully!");
            setTimeout(() => router.push("/login"), 400);
          }}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2.5 rounded-xl shadow-lg"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-74 bg-white shadow-lg transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
