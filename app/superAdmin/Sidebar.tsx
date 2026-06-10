"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tags,
  Users,
  BarChart3,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside
      className="
      lg:w-72
      bg-red-900
      text-white
      lg:min-h-screen
      p-4
      sm:p-6
    "
    >
      <h1 className="text-2xl font-bold mb-4 lg:mb-10">
        Cloud Kitchen
      </h1>

      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-3">

        <Link
          href="/superAdmin"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <Link
          href="/superAdmin/orders"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <ShoppingBag size={20} />
          Orders
        </Link>

        <Link
          href="/superAdmin/menu"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <UtensilsCrossed size={20} />
          Menu
        </Link>

        <Link
          href="/superAdmin/categories"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <Tags size={20} />
          Categories
        </Link>

        <Link
          href="/superAdmin/customers"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <Users size={20} />
          Customers
        </Link>

        <Link
          href="/superAdmin/reports"
          className="flex shrink-0 items-center gap-3 rounded-lg p-3 hover:bg-red-800"
        >
          <BarChart3 size={20} />
          Reports
        </Link>

      </nav>
    </aside>
  );
}
