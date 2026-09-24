"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Pagination from "@/app/_components/Pagination";

type OrderItem = {
  id: number;
  menuItemId: number | null;
  title: string;
  quantity: number;
  price: string;
};

type Order = {
  id: number;
  status: string;
  total: string;
  deliveryCharge: string;
  discountAmount: string;
  dueAmount: string;
  paymentMethod: string;
  paymentSettled: boolean | null;
  createdAt: string;
  items: OrderItem[];
};

type Payment = {
  id: number;
  createdAt: string;
  total: number;
  dueAmount: number;
  method: string;
  settled: boolean | null;
  status: string;
};

const ONLINE_METHODS = ["ONLINE", "ESEWA", "KHALTI"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Visibility rule:
 *  - Success (settled) → shown for ALL payment methods.
 *  - Pending / Cancelled → shown ONLY for COD.
 *  - Online (ESEWA / KHALTI / ONLINE) that never settled → hidden.
 */
function paymentOutcome(p: Payment): "success" | "pending" | "cancelled" | null {
  if (p.settled) return "success";
  if (p.method === "COD") {
    return p.status === "Cancelled" ? "cancelled" : "pending";
  }
  return null;
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    ESEWA: "bg-green-500/15 text-green-300 border-green-500/40",
    KHALTI: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    ONLINE: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    COD: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  };
  const isOnline = ONLINE_METHODS.includes(method);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${
        styles[method] ?? styles.ONLINE
      }`}
    >
      {isOnline ? <CreditCard size={14} /> : <Banknote size={14} />}
      {method}
    </span>
  );
}

function PaymentStatus({ outcome }: { outcome: "success" | "pending" | "cancelled" }) {
  if (outcome === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
        <CheckCircle size={14} /> Success
      </span>
    );
  }
  if (outcome === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium bg-red-500/10 text-red-300 border-red-500/30">
        <XCircle size={14} /> Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium bg-blue-500/10 text-blue-300 border-blue-500/30">
      <Clock size={14} /> Pending
    </span>
  );
}

function summaryCard(
  value: string,
  label: string,
  Icon: typeof Wallet,
  accent: string,
  subtitle?: string,
) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-lg ${accent} min-w-0`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="relative z-10 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium text-black/80 break-words leading-snug">
            {label}
          </p>
          <Icon size={20} className="text-black/60 shrink-0" />
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-2 break-words leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-black/70 mt-1 break-words leading-snug">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/user/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const payments = useMemo(
    () =>
      orders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        total: Number(o.total),
        dueAmount: Number(o.dueAmount),
        method: o.paymentMethod,
        settled: o.paymentSettled,
        status: o.status,
      })),
    [orders],
  );

  // Visibility: success for all methods; pending/cancelled only for COD.
  const visiblePayments = useMemo(() => {
    const base = payments.filter((p) => paymentOutcome(p) !== null);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (p) =>
        p.id.toString().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        paymentOutcome(p)?.includes(q),
    );
  }, [payments, search]);

  const successCount = payments.filter((p) => paymentOutcome(p) === "success").length;
  const codPendingCount = payments.filter((p) => paymentOutcome(p) === "pending").length;
  const codCancelledCount = payments.filter((p) => paymentOutcome(p) === "cancelled").length;

  const pagedPayments = visiblePayments.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Payment History</h1>
        <p className="text-zinc-400 mt-1">View your payment records and spending</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCard(
          `Rs.${payments.reduce((sum, p) => sum + p.total, 0).toFixed(2)}`,
          "Total Spent",
          Wallet,
          "bg-linear-to-br from-orange-400 to-orange-300",
        )}
        {summaryCard(
          `Rs.${payments.reduce((sum, p) => sum + p.dueAmount, 0).toFixed(2)}`,
          "Total Dues",
          TrendingUp,
          "bg-linear-to-br from-amber-400 to-orange-300",
        )}
        {summaryCard(
          `${successCount}`,
          "Successful Payments",
          CheckCircle,
          "bg-linear-to-br from-emerald-400 to-green-300",
        )}
        {summaryCard(
          `${codPendingCount + codCancelledCount}`,
          "COD Payments",
          Banknote,
          "bg-linear-to-br from-blue-400 to-cyan-300",
          `${codPendingCount} pending · ${codCancelledCount} cancelled`,
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <CreditCard
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          placeholder="Search by order ID, method, success, pending, cancelled..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-white placeholder-zinc-400"
        />
      </div>

      {payments.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-800 text-center">
          <Receipt size={64} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Payment History</h2>
          <p className="text-zinc-400">Your payment records will appear here</p>
        </div>
      ) : visiblePayments.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-800 text-center">
          <CreditCard size={48} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Results</h2>
          <p className="text-zinc-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-sm font-medium text-zinc-400 p-4">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 p-4">Date</th>
                  <th className="text-left text-sm font-medium text-zinc-400 p-4">Method</th>
                  <th className="text-left text-sm font-medium text-zinc-400 p-4">Payment</th>
                  <th className="text-right text-sm font-medium text-zinc-400 p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pagedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() =>
                      router.push(`/user/dashboard/order?highlight=${payment.id}`)
                    }
                    className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-medium text-white">
                      <span className="inline-flex items-center gap-1.5 group-hover:text-orange-400 transition-colors">
                        #{payment.id}
                        <ArrowUpRight
                          size={14}
                          className="text-zinc-500 group-hover:text-orange-400 transition-colors"
                        />
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">{formatDate(payment.createdAt)}</td>
                    <td className="p-4">
                      <MethodBadge method={payment.method} />
                    </td>
                    <td className="p-4">
                      <PaymentStatus outcome={paymentOutcome(payment)!} />
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-semibold text-white">Rs.{payment.total.toFixed(2)}</p>
                      {payment.dueAmount > 0 && (
                        <p className="text-xs text-amber-300 mt-0.5">Due: Rs.{payment.dueAmount.toFixed(2)}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        total={visiblePayments.length}
        perPage={perPage}
        page={page}
        onPage={setPage}
        label="Payments"
      />
    </div>
  );
}