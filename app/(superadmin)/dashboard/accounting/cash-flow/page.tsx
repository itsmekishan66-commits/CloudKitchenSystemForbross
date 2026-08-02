"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";
import Link from "next/link";
import PageNote from "../_components/PageNote";

interface CashFlowData {
  period: { startDate: string; endDate: string };
  operating: { inflow: number; outflow: number; net: number };
  investing: { inflow: number; outflow: number; net: number };
  financing: { inflow: number; outflow: number; net: number };
  netChange: number;
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

export default function CashFlowStatementPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
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
    let cancelled = false;
    const params = new URLSearchParams();
    if (useCustom && customStart && customEnd) {
      params.set("startDate", customStart);
      params.set("endDate", customEnd);
    } else {
      const dates = getDateRange(range);
      params.set("startDate", dates.startDate);
      params.set("endDate", dates.endDate);
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/accounting/cash-flow?${params.toString()}`
        );
        const d = await res.json();
        if (!cancelled && !d.error) setData(d);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, useCustom, customStart, customEnd]);

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
        <p className="text-gray-500">Failed to load cash flow statement</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Cash Flow Statement
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Operating, investing & financing activities
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
          <Link
            href={`/dashboard/accounting/journal-entries?startDate=${useCustom ? customStart : getDateRange(range).startDate}&endDate=${useCustom ? customEnd : getDateRange(range).endDate}`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-all"
            title="Open the underlying journal entries for this period"
          >
            <FileText size={14} />
            Entries
          </Link>
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
                        `/api/exports/${f}?source=cash-flow&startDate=${useCustom ? customStart : getDateRange(range).startDate}&endDate=${useCustom ? customEnd : getDateRange(range).endDate}`,
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
            Cash Flow Statement
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            For the period {data.period.startDate} to {data.period.endDate}
          </p>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowDownRight size={14} className="text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Operating Activities
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium">Inflow</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  {formatCurrency(data.operating.inflow)}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium">Outflow</p>
                <p className="text-lg font-bold text-red-700 mt-1">
                  {formatCurrency(data.operating.outflow)}
                </p>
              </div>
              <div
                className={`rounded-xl p-4 ${
                  data.operating.net >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    data.operating.net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Net Cash
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    data.operating.net >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(data.operating.net)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <ArrowUpRight size={14} className="text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Investing Activities
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium">Inflow</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  {formatCurrency(data.investing.inflow)}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium">Outflow</p>
                <p className="text-lg font-bold text-red-700 mt-1">
                  {formatCurrency(data.investing.outflow)}
                </p>
              </div>
              <div
                className={`rounded-xl p-4 ${
                  data.investing.net >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    data.investing.net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Net Cash
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    data.investing.net >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(data.investing.net)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <ArrowDownRight size={14} className="text-purple-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Financing Activities
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium">Inflow</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  {formatCurrency(data.financing.inflow)}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium">Outflow</p>
                <p className="text-lg font-bold text-red-700 mt-1">
                  {formatCurrency(data.financing.outflow)}
                </p>
              </div>
              <div
                className={`rounded-xl p-4 ${
                  data.financing.net >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    data.financing.net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Net Cash
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    data.financing.net >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(data.financing.net)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl p-6 flex justify-between items-center ${
              data.netChange >= 0
                ? "bg-linear-to-r from-emerald-500 to-emerald-600"
                : "bg-linear-to-r from-red-500 to-red-600"
            }`}
          >
            <div className="flex items-center gap-3">
              {data.netChange >= 0 ? (
                <TrendingUp size={24} className="text-white" />
              ) : (
                <TrendingDown size={24} className="text-white" />
              )}
              <span className="text-sm font-bold text-white/80">
                Net Change in Cash
              </span>
            </div>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(data.netChange)}
            </span>
          </div>
        </div>
      </motion.div>

      <PageNote
        points={[
          "Shows the Cash Flow Statement categorised into Operating, Investing and Financing activities.",
          "Each activity displays Cash Inflow, Cash Outflow and the Net Cash movement for the period.",
          "Net Change in Cash is the sum of the three activity net totals for the selected range.",
          "Use the preset ranges or a custom date range to change the reporting period.",
          "Use Entries to open the journal entries behind the selected period.",
          "Export the statement as PDF, CSV or Excel using the Export button.",
        ]}
      />
    </div>
  );
}
