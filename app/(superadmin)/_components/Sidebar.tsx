"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  UserPlus,
  Package,
  CreditCard,
  LifeBuoy,
  BarChart3,
  Megaphone,
  Settings,
  ShieldCheck,
  ClipboardList,
  Tags,
  MessageSquare,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission, Role } from "@/lib/rbac";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    title: "Users",
    href: "/dashboard/customers",
    icon: Users,
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    title: "Guest Users",
    href: "/dashboard/guest-users",
    icon: UserPlus,
    permission: PERMISSIONS.VIEW_GUEST_USERS,
  },
  {
    title: "Kitchen",
    href: "/dashboard/kitchen",
    icon: UtensilsCrossed,
    permission: PERMISSIONS.VIEW_KITCHENS,
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    permission: PERMISSIONS.VIEW_ORDERS,
  },
  {
    title: "Menu",
    href: "/dashboard/menu",
    icon: ClipboardList,
    permission: PERMISSIONS.VIEW_MENUS,
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: Tags,
    permission: PERMISSIONS.VIEW_CATEGORIES,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    permission: PERMISSIONS.VIEW_INVENTORY,
  },
  {
    title: "Payment",
    href: "/dashboard/payment",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_PAYMENTS,
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: LifeBuoy,
    permission: PERMISSIONS.VIEW_SUPPORTS,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    title: "Promotions",
    href: "/dashboard/promotions",
    icon: Megaphone,
    permission: PERMISSIONS.VIEW_PROMOTIONS,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
  {
    title: "Roles & Permissions",
    href: "/dashboard/roles",
    icon: ShieldCheck,
    permission: PERMISSIONS.VIEW_ROLES,
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    permission: PERMISSIONS.VIEW_MESSAGES,
  },
];

type SidebarProps = {
  role: string;
  userPermissions: string[];
};

export default function Sidebar({ role, userPermissions }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [siteName, setSiteName] = useState("Cloud Kitchen");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });

    toast.success("Logged out successfully");

    setTimeout(() => {
      router.push("/login");
    }, 400);
  };

  // Filter menu items based on permissions — DB first, fallback to static RBAC
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) {
      return true;
    }

    const useDb = userPermissions.length > 0;
    return useDb
      ? userPermissions.includes(item.permission)
      : hasPermission(role as Role, item.permission);
  });

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-orange-400">
          {siteName}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Admin Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? "bg-orange-300 text-black shadow-md"
                  : "text-gray-700 hover:bg-red-50 hover:text-orange-400"
                }
              `}
            >
              <Icon
                size={20}
                className={isActive ? "text-white" : ""}
              />

              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}