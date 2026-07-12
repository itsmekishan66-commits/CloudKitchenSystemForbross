"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import PageNote from "./_components/PageNote";

interface OverviewData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  recentEntries: {
    id: string;
    entryNumber: string;
    date: string;
    description: string;
    status: string;
    totalDebit: string;
    totalCredit: string;
  }[];
  accountSummary: {
    id: string;
    code: string;
    name: string;
    type: string;
    balance: string;
  }[];
}

const formatCurrency = (v: number) => {
  if (v >= 10000000) return `Rs.${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `Rs.${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `Rs.${(v / 1000).toFixed(1)}K`;
  return `Rs.${v.toLocaleString()}`;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50" },
  posted: { label: "Posted", color: "text-emerald-700", bg: "bg-emerald-50" },
  voided: { label: "Voided", color: "text-red-700", bg: "bg-red-50" },
};

const typeConfig: Record<string, { color: string; bg: string }> = {
  asset: { color: "text-blue-700", bg: "bg-blue-50" },
  liability: { color: "text-red-700", bg: "bg-red-50" },
  equity: { color: "text-purple-700", bg: "bg-purple-50" },
  revenue: { color: "text-emerald-700", bg: "bg-emerald-50" },
  expense: { color: "text-orange-700", bg: "bg-orange-50" },
};

export default function AccountingOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounting/overview")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
          <Landmark size={32} className="text-orange-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            No Accounts Found
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Set up your Chart of Accounts to get started with accounting.
          </p>
        </div>
        <Link
          href="/dashboard/accounting/chart-of-accounts"
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all"
        >
          Set Up Chart of Accounts
        </Link>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Assets",
      value: data.totalAssets,
      icon: Wallet,
      color: "from-blue-500 to-blue-600",
      positive: true,
    },
    {
      title: "Total Liabilities",
      value: data.totalLiabilities,
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      positive: false,
    },
    {
      title: "Total Equity",
      value: data.totalEquity,
      icon: Landmark,
      color: "from-purple-500 to-purple-600",
      positive: true,
    },
    {
      title: "Net Income (This Month)",
      value: data.netIncome,
      icon: data.netIncome >= 0 ? TrendingUp : TrendingDown,
      color:
        data.netIncome >= 0
          ? "from-emerald-500 to-emerald-600"
          : "from-red-500 to-red-600",
      positive: data.netIncome >= 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon size={18} className="text-white" />
                </div>
                {stat.positive ? (
                  <ArrowUpRight size={16} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
              </div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="text-xl font-bold mt-0.5">
                {formatCurrency(stat.value)}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100"
        >
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-md">
                <BookOpen size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Account Balances</h3>
                <p className="text-xs text-gray-400">
                  {data.accountSummary.length} accounts
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/accounting/chart-of-accounts"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.accountSummary.map((account) => {
              const tc = typeConfig[account.type] || typeConfig.asset;
              const balance = Number(account.balance);
              return (
                <div
                  key={account.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-12">
                      {account.code}
                    </span>
                    <span className="text-sm font-medium">{account.name}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tc.color} ${tc.bg}`}
                    >
                      {account.type}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      balance >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </span>
                </div>
              );
            })}
            {data.accountSummary.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No accounts configured yet
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100"
        >
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shadow-md">
                <BookOpen size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Recent Journal Entries</h3>
                <p className="text-xs text-gray-400">Last 5 entries</p>
              </div>
            </div>
            <Link
              href="/dashboard/accounting/journal-entries"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentEntries.map((entry) => {
              const sc = statusConfig[entry.status] || statusConfig.draft;
              return (
                <div
                  key={entry.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium text-gray-700">
                      {entry.entryNumber}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color} ${sc.bg}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium truncate max-w-50">
                      {entry.description}
                    </p>
                    <p className="text-xs text-gray-400">{entry.date}</p>
                  </div>
                </div>
              );
            })}
            {data.recentEntries.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No journal entries yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <PageNote
        points={[
          "Shows a snapshot of the business financial position pulled from the Chart of Accounts and Journal Entries.",
          "Stat cards display Total Assets, Total Liabilities, Total Equity and Net Income for the current month.",
          "Account Balances lists every configured account grouped by type with its current balance.",
          "Recent Journal Entries shows the last 5 double-entry records with their status (Draft, Posted, Voided).",
          "Use the 'View All' links to open the full Chart of Accounts or Journal Entries pages.",
        ]}
      />
    </div>
  );
}
