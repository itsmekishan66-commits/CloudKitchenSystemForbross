"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee, ShoppingCart, Users, TrendingUp, TrendingDown,
  Wallet, Clock, CalendarDays, BarChart3, PieChart, Download,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ReportData {
  totalOrders: number; totalRevenue: number; avgOrderValue: number;
  totalCustomers: number; totalMenuItems: number; totalExpenses: number; profit: number;
  revenueOverTime: { date: string; revenue: number; expenses: number }[];
  ordersOverTime: { date: string; orders: number }[];
  peakHours: { hour: number; label: string; orders: number; revenue: number }[];
  peakDays: { day: string; orders: number; revenue: number }[];
  popularItems: { title: string; totalQuantity: number; totalRevenue: number }[];
  categorySales: { category: string; totalQuantity: number; totalRevenue: number }[];
  customerGrowth: { month: string; newCustomers: number; totalCustomers: number }[];
  statusBreakdown: { status: string; count: number; revenue: number; color: string }[];
}

function formatCurrency(v: number) {
  if (v >= 10000000) return `Rs.${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `Rs.${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `Rs.${(v / 1000).toFixed(1)}K`;
  return `Rs.${v.toLocaleString()}`;
}

const formatRs = (v: number) => `Rs.${v.toLocaleString()}`;

const RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "1y", value: 365 },
  { label: "All", value: 9999 },
];

const CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#14b8a6"];

interface TooltipPayloadEntry { color?: string; name?: string; value?: number }
interface RechartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; format?: (v: number) => string }
const RechartTooltip = ({ active, payload, label, format }: RechartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900/90 px-3 py-2 text-xs text-white shadow-lg border border-white/10">
      <p className="text-gray-300 mb-0.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">{entry.name}: {format ? format(entry.value ?? 0) : entry.value}</p>
      ))}
    </div>
  );
};

const dayAbbr: Record<string, string> = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
const dayColors: Record<string, string> = { Monday: "#3b82f6", Tuesday: "#22c55e", Wednesday: "#f59e0b", Thursday: "#8b5cf6", Friday: "#f97316", Saturday: "#ef4444", Sunday: "#06b6d4" };

export default function ReportsClient() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [range, setRange] = useState(30);

  useEffect(() => {
    fetch(`/api/superadmin/reports?range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Loading reports...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center">
        <p className="text-red-600 font-semibold">Failed to load report data</p>
        <p className="text-red-400 text-sm mt-1">Please try refreshing the page</p>
      </div>
    </div>
  );

  const kpiCards = [
    { title: "Total Revenue", value: formatCurrency(data.totalRevenue), change: data.revenueOverTime.length > 1 ? (((data.revenueOverTime[data.revenueOverTime.length - 1].revenue - data.revenueOverTime[0].revenue) / Math.max(data.revenueOverTime[0].revenue, 1)) * 100).toFixed(1) : "0", icon: IndianRupee, bg: "bg-orange-50", tc: "text-orange-600" },
    { title: "Total Orders", value: data.totalOrders.toLocaleString(), change: data.ordersOverTime.length > 1 ? (((data.ordersOverTime[data.ordersOverTime.length - 1].orders - data.ordersOverTime[0].orders) / Math.max(data.ordersOverTime[0].orders, 1)) * 100).toFixed(1) : "0", icon: ShoppingCart, bg: "bg-blue-50", tc: "text-blue-600" },
    { title: "Avg Order Value", value: `Rs.${data.avgOrderValue.toFixed(2)}`, change: null, icon: Wallet, bg: "bg-purple-50", tc: "text-purple-600" },
    { title: "Total Customers", value: data.totalCustomers.toLocaleString(), change: null, icon: Users, bg: "bg-green-50", tc: "text-green-600" },
    { title: "Total Expenses", value: formatCurrency(data.totalExpenses), change: null, icon: TrendingDown, bg: "bg-red-50", tc: "text-red-600" },
    { title: "Net Profit", value: formatCurrency(data.profit), change: data.totalRevenue ? `${((data.profit / data.totalRevenue) * 100).toFixed(1)}% margin` : "0%", icon: TrendingUp, bg: data.profit >= 0 ? "bg-emerald-50" : "bg-red-50", tc: data.profit >= 0 ? "text-emerald-600" : "text-red-600" },
  ];

  const rangeLabel = RANGES.find(r => r.value === range)?.label || `${range}d`;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  const revData = data.revenueOverTime.map(d => ({ label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: d.revenue, expenses: d.expenses }));
  const ordData = data.ordersOverTime.map(d => ({ label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), orders: d.orders }));
  const peakHrData = [...data.peakHours].sort((a, b) => b.orders - a.orders).map(d => ({ label: d.label, orders: d.orders }));
  const peakDayData = data.peakDays.map(d => ({ label: dayAbbr[d.day] || d.day.slice(0, 3), orders: d.orders }));
  const popularData = [...data.popularItems].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 8).map(d => ({ label: d.title.length > 20 ? d.title.slice(0, 20) + "..." : d.title, qty: d.totalQuantity }));
  const catData = [...data.categorySales].sort((a, b) => b.totalQuantity - a.totalQuantity).map(d => ({ label: d.category, value: d.totalQuantity }));
  const custData = data.customerGrowth.map(d => ({ label: d.month, customers: d.totalCustomers }));
  const statusData = [...data.statusBreakdown].sort((a, b) => b.count - a.count).map(d => ({ label: d.status, value: d.count, color: d.color }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 p-6">
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive overview of your entire business</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl border border-gray-200 bg-white/80 p-1 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => { setLoading(true); setRange(r.value); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${range === r.value ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 bg-white/80 px-3 py-2 rounded-xl border border-gray-200">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <div className="relative">
            <button onClick={() => setExportOpen(!exportOpen)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 transition-all text-sm"><Download size={16} />Export</button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden z-10">
                {["pdf", "csv", "excel"].map((f) => (
                  <button key={f} onClick={() => { window.open(`/api/exports/${f}?source=reports`, "_blank"); setExportOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 capitalize">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 mb-8">
        {kpiCards.map((c) => { const Icon = c.icon; const ch = c.change ? parseFloat(c.change) : null; return (
          <div key={c.title} className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-lg backdrop-blur-xl hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`rounded-xl ${c.bg} p-2.5`}><Icon size={20} className={c.tc} /></div>
              {ch !== null && <span className={`flex items-center gap-0.5 text-xs font-medium ${ch >= 0 ? "text-green-600" : "text-red-600"}`}>{ch >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(ch).toFixed(1)}%</span>}
            </div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{c.title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        )})}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2></div>
            <span className="text-xs text-gray-400">Last {rangeLabel}</span>
          </div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v: number) => `Rs.${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<RechartTooltip format={formatRs} />} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revG)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><h2 className="text-lg font-bold text-gray-900">Orders Trend</h2></div>
            <span className="text-xs text-gray-400">Last {rangeLabel}</span>
          </div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordData}>
                <defs>
                  <linearGradient id="ordG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip content={<RechartTooltip />} />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ordG)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><Clock size={18} className="text-orange-500" /><h2 className="text-lg font-bold text-gray-900">Peak Hours</h2></div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHrData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} width={45} />
                <Tooltip content={<RechartTooltip />} />
                <Bar dataKey="orders" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {peakHrData.map((entry, i) => (
                    <Cell key={i} fill={entry.orders > 0 ? "#f97316" : "#f3f4f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><CalendarDays size={18} className="text-purple-500" /><h2 className="text-lg font-bold text-gray-900">Peak Days</h2></div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip content={<RechartTooltip />} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {peakDayData.map((entry, i) => (
                    <Cell key={i} fill={dayColors[data.peakDays[i]?.day] || "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><BarChart3 size={18} className="text-emerald-500" /><h2 className="text-lg font-bold text-gray-900">Top Selling Items</h2></div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} width={120} />
                <Tooltip content={<RechartTooltip />} />
                <Bar dataKey="qty" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={20} name="Qty Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><PieChart size={18} className="text-rose-500" /><h2 className="text-lg font-bold text-gray-900">Category Sales</h2></div>
          <div className="flex items-center justify-center h-55">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={catData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<RechartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><Users size={18} className="text-blue-500" /><h2 className="text-lg font-bold text-gray-900">Customer Growth</h2></div>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={custData}>
                <defs>
                  <linearGradient id="custG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip content={<RechartTooltip />} />
                <Area type="monotone" dataKey="customers" stroke="#22c55e" strokeWidth={2.5} fill="url(#custG)" name="Customers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1"><PieChart size={18} className="text-amber-500" /><h2 className="text-lg font-bold text-gray-900">Order Status</h2></div>
          <div className="flex items-center justify-center h-55">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={statusData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<RechartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
