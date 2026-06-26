"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { motion } from "framer-motion";
import {
  Wallet,
  Building2,
  TrendingUp,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Plus,
  Search,
  ChevronDown,
  CreditCard,
  Landmark,
  Smartphone,
  CircleArrowDown,
} from "lucide-react";

type PaymentMethod = "cash" | "bank" | "esewa" | "khalti" | "fonepay" | "card";
type TransactionType =
  | "cash_received"
  | "cash_paid"
  | "online_received"
  | "online_paid"
  | "expense"
  | "bank_transfer"
  | "refund";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  receivedFrom?: string;
  paidTo?: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

interface Due {
  id: string;
  personName: string;
  role: "customer" | "supplier" | "staff";
  totalDue: number;
  paid: number;
  remaining: number;
  status: "pending" | "partial" | "paid";
  createdAt: string;
}

const typeConfig: Record<TransactionType, { label: string; color: string; bg: string; icon: typeof ArrowDownRight }> = {
  cash_received: { label: "Cash Received", color: "text-emerald-700", bg: "bg-emerald-50", icon: ArrowDownRight },
  cash_paid: { label: "Cash Paid", color: "text-red-700", bg: "bg-red-50", icon: ArrowUpRight },
  online_received: { label: "Online Received", color: "text-emerald-700", bg: "bg-emerald-50", icon: ArrowDownRight },
  online_paid: { label: "Online Paid", color: "text-red-700", bg: "bg-red-50", icon: ArrowUpRight },
  expense: { label: "Expense", color: "text-orange-700", bg: "bg-orange-50", icon: ArrowUpRight },
  bank_transfer: { label: "Bank Transfer", color: "text-blue-700", bg: "bg-blue-50", icon: ArrowUpRight },
  refund: { label: "Refund", color: "text-purple-700", bg: "bg-purple-50", icon: ArrowDownRight },
};

const paymentIcons: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  bank: Landmark,
  esewa: Smartphone,
  khalti: Smartphone,
  fonepay: Smartphone,
  card: CreditCard,
};

const statusConfig = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  partial: { label: "Partial", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" },
  paid: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400" },
};

function DailyBalancesSection({ transactions }: { transactions: Transaction[] }) {
  const dailyBalances = useMemo(() => {
    const dailyMap = new Map<string, { received: number; paid: number }>();

    transactions.forEach((t) => {
      const prev = dailyMap.get(t.createdAt) || { received: 0, paid: 0 };
      if (t.type.includes("received") || t.type === "refund") {
        prev.received += t.amount;
      } else {
        prev.paid += t.amount;
      }
      dailyMap.set(t.createdAt, prev);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();

    let opening = 0;
    const balances: { date: string; opening: number; received: number; paid: number; closing: number }[] = [];

    sortedDates.forEach((date) => {
      const day = dailyMap.get(date)!;
      const closing = opening + day.received - day.paid;
      balances.push({ date, opening, received: day.received, paid: day.paid, closing });
      opening = closing;
    });

    return balances;
  }, [transactions]);

  const totals = useMemo(() => {
    const t = { opening: 0, closing: 0 };
    if (dailyBalances.length === 0) return t;
    t.opening = dailyBalances[0].opening;
    t.closing = dailyBalances[dailyBalances.length - 1].closing;
    return t;
  }, [dailyBalances]);

  if (dailyBalances.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="bg-white rounded-2xl border border-gray-100"
    >
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-md">
            <Landmark size={16} className="text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Daily Balance Overview</h3>
            <p className="text-xs text-gray-400">Opening & closing balance by day</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Opening Balance</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {dailyBalances.map((d, i) => {
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <motion.tr
                  key={d.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${isToday ? "bg-orange-50/40" : ""}`}
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium">{d.date}</span>
                    {isToday && (
                      <span className="ml-2 text-[10px] font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">Today</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold">Rs {d.opening.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold">Rs {d.closing.toLocaleString()}</td>
                </motion.tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="px-5 py-4 text-sm font-bold">Total</td>
              <td className="px-5 py-4 text-right text-sm font-bold">Rs {totals.opening.toLocaleString()}</td>
              <td className="px-5 py-4 text-right text-sm font-bold">Rs {totals.closing.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
}

export default function PaymentPage() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);

  const [open, setOpen] = useState(false);
  const handleDownload = (type: string) => {
    if (type) {
      window.open(`/api/exports/${type}?source=payment`, "_blank");
    }
  };

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        const txList = (data.transactions || []).map((t: Record<string, unknown>) => ({
          ...t,
          amount: Number(t.amount),
          createdAt: t.createdAt ? (t.createdAt as string).slice(0, 10) : "",
        }));
        const dueList = (data.dues || []).map((d: Record<string, unknown>) => ({
          ...d,
          totalDue: Number(d.totalDue),
          paid: Number(d.paid),
          remaining: Number(d.remaining),
          createdAt: d.createdAt ? (d.createdAt as string).slice(0, 10) : "",
        }));
        setTransactions(txList);
        setDues(dueList);
      })
      .catch((err) => console.error("Failed to load payments", err))
      .finally(() => setLoading(false));
  }, []);

  const PER_PAGE = 10;

  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [txPage, setTxPage] = useState(1);
  const [receivablePage, setReceivablePage] = useState(1);
  const [duesPage, setDuesPage] = useState(1);
  const [form, setForm] = useState({
    type: "cash_received" as TransactionType,
    amount: "",
    person: "",
    method: "cash" as PaymentMethod,
    txId: "",
    notes: "",
  });

  const filteredTransactions = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return transactions.filter((t) =>
      !q ||
      typeConfig[t.type].label.toLowerCase().includes(q) ||
      t.receivedFrom?.toLowerCase().includes(q) ||
      t.paidTo?.toLowerCase().includes(q) ||
      t.paymentMethod.toLowerCase().includes(q) ||
      t.transactionId?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  }, [transactions, globalSearch]);

  const filteredDues = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return dues.filter((d) => {
      const matchesSearch = !q || d.personName.toLowerCase().includes(q) || d.role.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || d.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [dues, globalSearch, filterStatus]);

  const analytics = useMemo(() => {
    let cashReceived = 0, onlineReceived = 0, cashPaid = 0, onlinePaid = 0, expenses = 0;
    let bankTransfer = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "cash_received") cashReceived += t.amount;
      if (t.type === "online_received") onlineReceived += t.amount;
      if (t.type === "cash_paid") cashPaid += t.amount;
      if (t.type === "online_paid") onlinePaid += t.amount;
      if (t.type === "expense") expenses += t.amount;
      if (t.type === "bank_transfer") bankTransfer += t.amount;
      if (t.type === "refund") {
        if (t.paymentMethod === "cash") cashPaid += t.amount;
        else onlinePaid += t.amount;
      }
    });
    const cashBalance = cashReceived - cashPaid - expenses - bankTransfer;
    const bankBalance = onlineReceived - onlinePaid + bankTransfer;
    const pendingDue = filteredDues.reduce((acc, d) => acc + d.remaining, 0);
    const totalDueAll = filteredDues.reduce((acc, d) => acc + d.totalDue, 0);
    const totalCollected = filteredDues.reduce((acc, d) => acc + d.paid, 0);
    const customerDues = filteredDues.filter((d) => d.role === "customer").reduce((acc, d) => acc + d.remaining, 0);
    const customerDueTotal = filteredDues.filter((d) => d.role === "customer").reduce((acc, d) => acc + d.totalDue, 0);
    const customerDuePaid = filteredDues.filter((d) => d.role === "customer").reduce((acc, d) => acc + d.paid, 0);
    const supplierDueTotal = filteredDues.filter((d) => d.role !== "customer").reduce((acc, d) => acc + d.totalDue, 0);
    const supplierDuePaid = filteredDues.filter((d) => d.role !== "customer").reduce((acc, d) => acc + d.paid, 0);
    const supplierDueRemaining = filteredDues.filter((d) => d.role !== "customer").reduce((acc, d) => acc + d.remaining, 0);
    return { cashReceived, onlineReceived, cashPaid, onlinePaid, expenses, cashBalance, bankBalance, pendingDue, totalSales: cashReceived + onlineReceived, totalDueAll, totalCollected, customerDues, customerDueTotal, customerDuePaid, supplierDueTotal, supplierDuePaid, supplierDueRemaining };
  }, [filteredTransactions, filteredDues]);

  async function addTransaction() {
    if (!form.amount) return;
    const amount = Number(form.amount);
    const id = crypto.randomUUID();
    const newTx: Transaction = {
      id,
      type: form.type,
      amount,
      receivedFrom: form.type.includes("received") ? form.person : undefined,
      paidTo: !form.type.includes("received") ? form.person : undefined,
      paymentMethod: form.method,
      transactionId: form.txId,
      notes: form.notes,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _kind: "transaction", ...newTx }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      setTransactions((prev) => [newTx, ...prev]);
      setForm({ type: "cash_received", amount: "", person: "", method: "cash", txId: "", notes: "" });
      setShowForm(false);
      setShowSupplierForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add transaction";
      setMessage(msg);
      setMessageType("error");
    }
  }

  async function settleDue(id: string, amount: number) {
    let updated: Due | undefined;
    const next = dues.map((d) => {
      if (d.id !== id) return d;
      const newPaid = Math.min(d.paid + amount, d.totalDue);
      const newRemaining = d.totalDue - newPaid;
      const newStatus = newRemaining === 0 ? "paid" : newPaid > 0 ? "partial" : "pending";
      updated = { ...d, paid: newPaid, remaining: newRemaining, status: newStatus };
      return updated;
    });

    if (!updated) return;

    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _kind: "settle_due",
          id,
          paid: updated.paid,
          remaining: updated.remaining,
          status: updated.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to settle due");
      setDues(next);
    } catch (err) {
      console.error("Failed to settle due", err);
    }
  }

  const paginatedTx = useMemo(() => filteredTransactions.slice(0, txPage * PER_PAGE), [filteredTransactions, txPage]);
  const paginatedReceivables = useMemo(() => filteredDues.filter((d) => d.role === "customer").slice(0, receivablePage * PER_PAGE), [filteredDues, receivablePage]);
  const paginatedDues = useMemo(() => filteredDues.filter((d) => d.role !== "customer").slice(0, duesPage * PER_PAGE), [filteredDues, duesPage]);

  const hasMoreTx = paginatedTx.length < filteredTransactions.length;
  const hasMoreReceivables = paginatedReceivables.length < filteredDues.filter((d) => d.role === "customer").length;
  const hasMoreDues = paginatedDues.length < filteredDues.filter((d) => d.role !== "customer").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {message ? (
        <p className={`rounded-xl p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </p>
      ) : null}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage transactions, dues & financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              placeholder="Search anything..."
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-56 transition-all"
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setTxPage(1); setReceivablePage(1); setDuesPage(1); }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border rounded-full px-4 py-2">
            <Clock size={14} />
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </div>
          {can("DOWNLOAD_PAYMENTS") && (
            <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
              <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
                <option className="text-black" value="">Export</option>
                <option className="text-black" value="pdf">PDF</option>
                <option className="text-black" value="csv">CSV</option>
                <option className="text-black" value="excel">Excel</option>
              </select>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Cash Balance", value: analytics.cashBalance, icon: Wallet, color: "from-emerald-500 to-emerald-600", change: "+12%", isPositive: analytics.cashBalance >= 0 },
          { title: "Bank Balance", value: analytics.bankBalance, icon: Building2, color: "from-blue-500 to-blue-600", change: "+8%", isPositive: analytics.bankBalance >= 0 },
          { title: "Today's Sales", value: analytics.totalSales, icon: TrendingUp, color: "from-violet-500 to-violet-600", change: "+23%", isPositive: true },
          { title: "Pending Due", value: analytics.pendingDue, icon: Clock, color: "from-amber-500 to-amber-600", change: "", isPositive: false },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-lg">
                  <Icon size={18} className="text-black" />
                </div>
                {card.change && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                    {card.change}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-3 font-medium">{card.title}</p>
              <h2 className="text-xl font-bold mt-0.5 tracking-tight">Rs {card.value.toLocaleString()}</h2>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Cash Received", value: analytics.cashReceived, color: "text-emerald-600" },
          { label: "Online Received", value: analytics.onlineReceived, color: "text-blue-600" },
          { label: "Expenses", value: analytics.expenses, color: "text-red-600" },
          { label: "Online Paid", value: analytics.onlinePaid, color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${s.color}`}>Rs {s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Daily Balances Section */}
      <DailyBalancesSection transactions={transactions} />

      {/* Quick Actions — full width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-linear-to-r from-orange-100 to-orange-200 text-black rounded-2xl p-5 flex items-center justify-between hover:shadow-xl hover:shadow-gray-900/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-black" />
              </div>
              <div className="text-left ">
                <p className="font-semibold">Record New Transaction</p>
                <p className="text-sm text-black">Add cash, online payments, expenses & more</p>
              </div>
            </div>
            <ChevronDown size={20} className="text-black group-hover:translate-x-1 transition-transform" />
          </button>
        ) : can("CREATE_PAYMENTS") && (
          <div className="bg-orange-200 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">New Transaction</h3>
              <button onClick={() => setShowForm(false)} className="text-xs text-black hover:text-gray-600">Cancel</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                <option value="cash_received">Cash Received</option>
                <option value="cash_paid">Cash Paid</option>
                <option value="online_received">Online Received</option>
                <option value="online_paid">Online Paid</option>
                <option value="expense">Expense</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="refund">Refund</option>
              </select>
              <input placeholder="Amount" type="number" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input placeholder="Received from / Paid to" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} />
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                <option>cash</option>
                <option>bank</option>
                <option>esewa</option>
                <option>khalti</option>
                <option>fonepay</option>
                <option>card</option>
              </select>
              <input placeholder="Transaction ID" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.txId} onChange={(e) => setForm({ ...form, txId: e.target.value })} />
              <input placeholder="Notes (optional)" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {can("CREATE_PAYMENTS") && (
              <button onClick={addTransaction} className="mt-4 bg-orange-500 text-black text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-orange-300 transition-all">
                Add Transaction
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick actions for record new suppliers */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {!showSupplierForm ? (
          <button
            onClick={() => setShowSupplierForm(true)}
            className="w-full bg-linear-to-r from-orange-100 to-orange-200 text-black rounded-2xl p-5 flex items-center justify-between hover:shadow-xl hover:shadow-gray-900/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-black" />
              </div>
              <div className="text-left ">
                <p className="font-semibold">Record New suppliers</p>
                <p className="text-sm text-black">Add cash, online payments, expenses & more</p>
              </div>
            </div>
            <ChevronDown size={20} className="text-black group-hover:translate-x-1 transition-transform" />
          </button>
        ) : can("CREATE_PAYMENTS") && (
          <div className="bg-orange-200 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">New Supplier Transaction</h3>
              <button onClick={() => setShowSupplierForm(false)} className="text-xs text-black hover:text-gray-600">Cancel</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                <option value="cash_paid">Cash Paid</option>
                <option value="online_paid">Online Paid</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wallet_transfer">Wallet Transfer</option>
              </select>
              <input placeholder="Amount" type="number" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input placeholder="Received from / Paid to" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} />
              <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                <option>cash</option>
                <option>bank</option>
                <option>esewa</option>
                <option>khalti</option>
                <option>fonepay</option>
                <option>card</option>
              </select>
              <input placeholder="Transaction ID" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.txId} onChange={(e) => setForm({ ...form, txId: e.target.value })} />
              <input placeholder="Notes (optional)" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {can("CREATE_PAYMENTS") && (
              <button onClick={addTransaction} className="mt-4 bg-orange-500 text-black text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-orange-300 transition-all">
                Add Supplier Transaction
              </button>
            )}
          </div>
        )}
      </motion.div> */}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due from Customers similar vatera comment out gareko */}
        {/* <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full"
          >
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Due from Customers</h3>
                    <p className="text-xs text-gray-400">{filteredDues.filter((d) => d.role === "customer").length} customers</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-rose-600">Rs {analytics.customerDues.toLocaleString()}</span>
              </div>
              <div className="mt-4 bg-rose-50 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Collection Rate</span>
                  <span className="font-semibold text-rose-700">
                    {analytics.totalDueAll > 0 ? Math.round((analytics.totalCollected / analytics.totalDueAll) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analytics.totalDueAll > 0 ? (analytics.totalCollected / analytics.totalDueAll) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-to-r from-rose-400 to-rose-600 rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {filteredDues.filter((d) => d.role === "customer").map((d) => {
                const progress = d.totalDue > 0 ? Math.round((d.paid / d.totalDue) * 100) : 0;
                const sc = statusConfig[d.status];
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{d.personName}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color} ${sc.bg}`}>{sc.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-to-r from-rose-400 to-rose-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Rs {d.remaining.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredDues.filter((d) => d.role === "customer").length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No customer dues</p>
              )}
            </div>
            <div className="p-4 pt-0">
              <button className="w-full text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl py-2.5 transition-colors">
                View All Customers
              </button>
            </div>
          </motion.div>
        </div> */}

        {/* Recent Transactions */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100"
          >
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-md">
                  <Banknote size={16} className="text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Recent Transactions</h3>
                  <p className="text-xs text-gray-400">{filteredTransactions.length} entries</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">From / To</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Method</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTx.map((t, i) => {
                    const Icon = typeConfig[t.type].icon;
                    const PaymentIcon = paymentIcons[t.paymentMethod];
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Icon size={14} className="text-black" />
                            </div>
                            <span className="text-sm font-medium">{typeConfig[t.type].label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${t.type.includes("received") || t.type === "refund" ? "text-emerald-600" : "text-red-600"}`}>
                            {t.type.includes("received") || t.type === "refund" ? "+" : "-"}Rs {t.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{t.receivedFrom || t.paidTo || "-"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <PaymentIcon size={12} className="text-black" />
                            <span className="text-sm capitalize text-gray-500">{t.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{t.createdAt}</td>
                      </motion.tr>
                    );
                  })}
                  {paginatedTx.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing {paginatedTx.length} of {filteredTransactions.length}
              </span>
              {hasMoreTx && (
                <button
                  onClick={() => setTxPage((p) => p + 1)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
                >
                  Next <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Receivables & Dues Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables - money owed TO the business */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100"
        >
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-md">
                <TrendingUp size={16} className="text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Receivables</h3>
                <p className="text-xs text-gray-400">Money owed to you</p>
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              Rs {analytics.customerDues.toLocaleString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Paid</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Remaining</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceivables.map((d, i) => {
                  const sc = statusConfig[d.status];
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">
                            {d.personName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{d.personName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">Rs {d.totalDue.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-emerald-600 font-medium">Rs {d.paid.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-semibold">Rs {d.remaining.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.color} ${sc.bg} flex items-center gap-1.5 w-fit`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredDues.filter((d) => d.role === "customer").length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No receivables</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {paginatedReceivables.length} of {filteredDues.filter((d) => d.role === "customer").length}
            </span>
            {hasMoreReceivables && (
              <button
                onClick={() => setReceivablePage((p) => p + 1)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
              >
                Next <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Dues - money the business owes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100"
        >
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-md">
                <Clock size={16} className="text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Dues (Payables)</h3>
                <p className="text-xs text-gray-400">Money you owe</p>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-600">
              Rs {analytics.supplierDueRemaining.toLocaleString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Paid</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Remaining</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDues.map((d, i) => {
                  const sc = statusConfig[d.status];
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-100 to-amber-200 flex items-center justify-center text-xs font-bold text-amber-700">
                            {d.personName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{d.personName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">Rs {d.totalDue.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-emerald-600 font-medium">Rs {d.paid.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-semibold">Rs {d.remaining.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.color} ${sc.bg} flex items-center gap-1.5 w-fit`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredDues.filter((d) => d.role !== "customer").length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No dues</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {paginatedDues.length} of {filteredDues.filter((d) => d.role !== "customer").length}
            </span>
            {hasMoreDues && (
              <button
                onClick={() => setDuesPage((p) => p + 1)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
              >
                Next <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
