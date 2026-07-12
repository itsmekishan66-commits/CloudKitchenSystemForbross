"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Download, Calendar } from "lucide-react";
import PageNote from "../_components/PageNote";

interface IncomeStatementData {
  period: { startDate: string; endDate: string };
  revenue: { items: { account: string; amount: number }[]; total: number };
  cogs: { items: { account: string; amount: number }[]; total: number };
  grossProfit: number;
  operatingExpenses: {
    items: { account: string; amount: number }[];
    total: number;
  };
  operatingIncome: number;
  nonOperatingExpenses: {
    items: { account: string; amount: number }[];
    total: number;
  };
  netIncome: number;
}

const formatCurrency = (v: number) => `Rs.${v.toLocaleString()}`;

const RANGES = [
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

function getDateRange(value: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().substring(0, 10);
  let startDate: string;

  switch (value) {
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .substring(0, 10);
      break;
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
        .toISOString()
        .substring(0, 10);
      break;
    }
    case "year":
      startDate = `${now.getFullYear()}-01-01`;
      break;
    default:
      startDate = "2000-01-01";
  }

  return { startDate, endDate };
}

export default function IncomeStatementPage() {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [range, setRange] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [useCustom, setUseCustom] = useState(false);
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
    const params = new URLSearchParams();
    if (useCustom && customStart && customEnd) {
      params.set("startDate", customStart);
      params.set("endDate", customEnd);
    } else {
      const dates = getDateRange(range);
      params.set("startDate", dates.startDate);
      params.set("endDate", dates.endDate);
    }
    fetch(`/api/accounting/income-statement?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(console.error);
  }, [range, useCustom, customStart, customEnd]);

  const loading = data === null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load income statement</p>
      </div>
    );
  }

  const grossMargin =
    data.revenue.total > 0
      ? ((data.grossProfit / data.revenue.total) * 100).toFixed(1)
      : "0";
  const netMargin =
    data.revenue.total > 0
      ? ((data.netIncome / data.revenue.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Income Statement
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Profit & Loss for the selected period
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl border border-gray-200 bg-white/80 p-1 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRange(r.value);
                  setUseCustom(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  !useCustom && range === r.value
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(!useCustom)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                useCustom
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Calendar size={12} />
              Custom
            </button>
          </div>
          {useCustom && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          )}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-white font-semibold hover:bg-orange-600 transition-all text-sm"
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
                        `/api/exports/${f}?source=income-statement&startDate=${useCustom ? customStart : getDateRange(range).startDate}&endDate=${useCustom ? customEnd : getDateRange(range).endDate}`,
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
          <h3 className="text-lg font-bold text-gray-900">
            Income Statement
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            For the period {data.period.startDate} to {data.period.endDate}
          </p>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Revenue
            </h4>
            <div className="space-y-2">
              {data.revenue.items.map((item) => (
                <div key={item.account} className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">{item.account}</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {data.revenue.items.length === 0 && (
                <p className="text-sm text-gray-400 pl-4">No revenue recorded</p>
              )}
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
              <span>Total Revenue</span>
              <span className="text-emerald-600">
                {formatCurrency(data.revenue.total)}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Cost of Goods Sold
            </h4>
            <div className="space-y-2">
              {data.cogs.items.map((item) => (
                <div key={item.account} className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">{item.account}</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {data.cogs.items.length === 0 && (
                <p className="text-sm text-gray-400 pl-4">No COGS recorded</p>
              )}
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
              <span>Total COGS</span>
              <span className="text-red-600">
                ({formatCurrency(data.cogs.total)})
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="text-sm font-bold">Gross Profit</span>
              <span className="text-xs text-gray-500 ml-2">
                ({grossMargin}% margin)
              </span>
            </div>
            <span
              className={`text-lg font-bold ${
                data.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data.grossProfit)}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Operating Expenses
            </h4>
            <div className="space-y-2">
              {data.operatingExpenses.items.map((item) => (
                <div key={item.account} className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">{item.account}</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {data.operatingExpenses.items.length === 0 && (
                <p className="text-sm text-gray-400 pl-4">
                  No operating expenses recorded
                </p>
              )}
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
              <span>Total Operating Expenses</span>
              <span className="text-red-600">
                ({formatCurrency(data.operatingExpenses.total)})
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-bold">Operating Income</span>
            <span
              className={`text-lg font-bold ${
                data.operatingIncome >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data.operatingIncome)}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Non-Operating Items
            </h4>
            <div className="space-y-2">
              {data.nonOperatingExpenses.items.map((item) => (
                <div key={item.account} className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">{item.account}</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {data.nonOperatingExpenses.items.length === 0 && (
                <p className="text-sm text-gray-400 pl-4">
                  No non-operating items recorded
                </p>
              )}
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
              <span>Total Non-Operating</span>
              <span className="text-red-600">
                ({formatCurrency(data.nonOperatingExpenses.total)})
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl p-6 flex justify-between items-center ${
              data.netIncome >= 0
                ? "bg-linear-to-r from-emerald-500 to-emerald-600"
                : "bg-linear-to-r from-red-500 to-red-600"
            }`}
          >
            <div className="flex items-center gap-3">
              {data.netIncome >= 0 ? (
                <TrendingUp size={24} className="text-white" />
              ) : (
                <TrendingDown size={24} className="text-white" />
              )}
              <div>
                <span className="text-sm font-bold text-white/80">
                  Net Income
                </span>
                <span className="text-xs text-white/60 ml-2">
                  ({netMargin}% margin)
                </span>
              </div>
            </div>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(data.netIncome)}
            </span>
          </div>
        </div>
      </motion.div>

      <PageNote
        points={[
          "Shows the Profit & Loss statement (Income Statement) for the selected date range.",
          "Breaks down Revenue, Cost of Goods Sold, Gross Profit, Operating Expenses and Non-Operating Expenses.",
          "Net Income is computed and shown with Gross Margin % and Net Margin % against revenue.",
          "Switch ranges (This Month / Quarter / Year / All Time) or pick a custom start and end date.",
          "Export the statement as PDF, CSV or Excel using the Export button.",
        ]}
      />
    </div>
  );
}
