"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Scale, Download, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import PageNote from "../_components/PageNote";

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    categories: {
      category: string;
      accounts: { id: string; name: string; balance: number }[];
      total: number;
    }[];
    total: number;
  };
  liabilities: {
    categories: {
      category: string;
      accounts: { id: string; name: string; balance: number }[];
      total: number;
    }[];
    total: number;
  };
  equity: { accounts: { id: string; name: string; balance: number }[]; total: number };
  totalLiabilitiesAndEquity: number;
}

const formatCurrency = (v: number) => `Rs.${v.toLocaleString()}`;

export default function BalanceSheetPage() {
  const [state, setState] = useState<{ date: string; value: BalanceSheetData } | null>(null);
  const [error, setError] = useState(false);
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/accounting/balance-sheet?asOfDate=${asOfDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.error) {
          setState({ date: asOfDate, value: d });
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [asOfDate]);

  const loading = state?.date !== asOfDate && !error;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load balance sheet</p>
      </div>
    );
  }

  const data = state!.value;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Balance Sheet</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Assets = Liabilities + Equity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <Link
            href={`/dashboard/accounting/journal-entries?endDate=${asOfDate}`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-all"
            title="Open the underlying journal entries up to this date"
          >
            <FileText size={14} />
            Entries
          </Link>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-white font-semibold hover:bg-orange-600 transition-all text-sm"
            >
              <Download size={14} />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden z-10">
                {["pdf", "csv", "excel"].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      window.open(
                        `/api/exports/${f}?source=balance-sheet&asOfDate=${asOfDate}`,
                        "_blank"
                      );
                      setExportOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 capitalize"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Balance Sheet</h3>
          <p className="text-sm text-gray-500 mt-1">
            As of {data.asOfDate}
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Scale size={14} className="text-blue-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Assets
                </h4>
              </div>
              <div className="space-y-4">
                {data.assets.categories.map((category) => (
                  <div key={category.category}>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      {category.category}
                    </h5>
                    <div className="space-y-1">
                      {category.accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex justify-between text-sm py-1"
                        >
                          <Link
                            href={`/dashboard/accounting/journal-entries?accountId=${account.id}`}
                            className="text-gray-600 pl-4 hover:text-orange-600 transition-colors"
                            title="View journal entries for this account"
                          >
                            {account.name}
                          </Link>
                          <span className="font-medium">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-100">
                      <span>{category.category}</span>
                      <span>{formatCurrency(category.total)}</span>
                    </div>
                  </div>
                ))}
                {data.assets.categories.length === 0 && (
                  <p className="text-sm text-gray-400">No assets recorded</p>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-900">
                  Total Assets
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(data.assets.total)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Scale size={14} className="text-red-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Liabilities
                  </h4>
                </div>
                <div className="space-y-4">
                  {data.liabilities.categories.map((category) => (
                    <div key={category.category}>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {category.category}
                      </h5>
                      <div className="space-y-1">
                        {category.accounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex justify-between text-sm py-1"
                          >
                            <Link
                              href={`/dashboard/accounting/journal-entries?accountId=${account.id}`}
                              className="text-gray-600 pl-4 hover:text-orange-600 transition-colors"
                              title="View journal entries for this account"
                            >
                              {account.name}
                            </Link>
                            <span className="font-medium">
                              {formatCurrency(account.balance)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-100">
                        <span>{category.category}</span>
                        <span>{formatCurrency(category.total)}</span>
                      </div>
                    </div>
                  ))}
                {data.liabilities.categories.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No liabilities recorded
                  </p>
                )}
              </div>
              <div className="bg-red-50 rounded-xl p-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-red-900">
                  Total Liabilities
                </span>
                <span className="text-lg font-bold text-red-900">
                  {formatCurrency(data.liabilities.total)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Scale size={14} className="text-purple-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Equity
                  </h4>
                </div>
                <div className="space-y-1">
                  {data.equity.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex justify-between text-sm py-1"
                    >
                      {account.id ? (
                        <Link
                          href={`/dashboard/accounting/journal-entries?accountId=${account.id}`}
                          className="text-gray-600 hover:text-orange-600 transition-colors"
                          title="View journal entries for this account"
                        >
                          {account.name}
                        </Link>
                      ) : (
                        <span className="text-gray-600">{account.name}</span>
                      )}
                      <span className="font-medium">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  ))}
                  {data.equity.accounts.length === 0 && (
                    <p className="text-sm text-gray-400">
                      No equity recorded
                    </p>
                  )}
                </div>
                <div className="bg-purple-50 rounded-xl p-4 mt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-purple-900">
                    Total Equity
                  </span>
                  <span className="text-lg font-bold text-purple-900">
                    {formatCurrency(data.equity.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div
              className={`rounded-xl p-6 flex justify-between items-center ${
                Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                  ? "bg-linear-to-r from-emerald-500 to-emerald-600"
                  : "bg-linear-to-r from-red-500 to-red-600"
              }`}
            >
              <span className="text-sm font-bold text-white">
                {                Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                  ? "Balance Sheet is Balanced"
                  : "Balance Sheet is NOT Balanced"}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/70">
                  Assets: {formatCurrency(data.assets.total)}
                </span>
                <span className="text-xs text-white/70">=</span>
                <span className="text-xs text-white/70">
                  L+E: {formatCurrency(data.totalLiabilitiesAndEquity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PageNote
        points={[
          "Shows the Balance Sheet as of a chosen date (Assets = Liabilities + Equity).",
          "Assets are grouped into Current and Fixed Assets; only accounts with a non-zero balance are listed.",
          "Liabilities are grouped into Current and Long-term Liabilities.",
          "Equity includes equity accounts plus current-period Retained Earnings (Net Income).",
          "A banner confirms whether the sheet is balanced (Assets equal Liabilities + Equity).",
          "Click an account name to open its journal entries, or use Entries to view all entries up to the as-of date.",
          "Change the 'As of' date to view the position on any past date; export via PDF, CSV or Excel.",
        ]}
      />
    </div>
  );
}
