"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  Scale,
  Calculator,
  TrendingUp,
} from "lucide-react";

const quickLinks = [
  {
    title: "Income Statement",
    description: "View Profit & Loss for any period",
    href: "/dashboard/accounting/income-statement",
    icon: TrendingUp,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Cash Flow Statement",
    description: "Track cash movements",
    href: "/dashboard/accounting/cash-flow",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities & equity",
    href: "/dashboard/accounting/balance-sheet",
    icon: Scale,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Chart of Accounts",
    description: "Manage account categories",
    href: "/dashboard/accounting/chart-of-accounts",
    icon: BookOpen,
    color: "from-orange-500 to-orange-600",
  },
  {
    title: "Journal Entries",
    description: "View all financial entries",
    href: "/dashboard/accounting/journal-entries",
    icon: Calculator,
    color: "from-rose-500 to-rose-600",
  },
];

export default function QuickNav() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {quickLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.title}
            href={link.href}
            className={`group relative overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl hover:shadow-xl transition-all ${
              isActive
                ? "border-white/40 bg-orange-200/80"
                : "border-white/40 bg-white/90"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${
                isActive ? "scale-110" : ""
              }`}
            >
              <Icon size={18} className="text-white" />
            </div>
            <h3
              className={`font-semibold text-sm ${
                isActive ? "text-orange-700" : "text-gray-900"
              }`}
            >
              {link.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{link.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
