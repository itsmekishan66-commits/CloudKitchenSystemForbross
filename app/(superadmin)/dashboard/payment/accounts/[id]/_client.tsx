"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Search,
  Calendar,
  Loader2,
  Banknote,
  Landmark,
  Smartphone,
  ArrowDownRight,
  ArrowUpRight,
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
  enrichedPerson?: string | null;
}

interface PaymentAccount {
  id: string;
  accountName: string;
  holderName: string;
  method: string;
  accountNumber: string;
  status: string;
  qrCode: string | null;
  openingBalance: number;
  totalReceived: number;
  totalPaid: number;
  closingBalance: number;
}

interface AccountData {
  account: PaymentAccount;
  transactions: Transaction[];
}

const typeConfig: Record<TransactionType, { label: string; color: string; bg: string; icon: typeof ArrowDownRight }> = {
  cash_received: { label: "Cash Received", color: "text-emerald-700", bg: "bg-emerald-50", icon: ArrowDownRight },
  cash_paid: { label: "Cash Paid", color: "text-red-700", bg: "bg-red-50", icon: ArrowUpRight },
  online_received: { label: "Online Received", color: "text-emerald-700", bg: "bg-emerald-50", icon: ArrowDownRight },
  online_paid: { label: "Online Paid", color: "text-red-700", bg: "bg-red-50", icon: ArrowUpRight },
  expense: { label: "Expense", color: "text-orange-700", bg: "bg-orange-50", icon: ArrowUpRight },
  bank_transfer: { label: "Bank Transfer", color: "text-blue-700", bg: "bg-blue-50", icon: ArrowUpRight },
  refund: { label: "Refund", color: "text-purple-700", bg: "bg-purple-50", icon: ArrowUpRight },
};

const paymentIcons: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  bank: Landmark,
  esewa: Smartphone,
  khalti: Smartphone,
  fonepay: Smartphone,
  card: CreditCard,
};

const methodConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CreditCard }> = {
  esewa: { label: "eSewa", color: "text-green-700", bg: "bg-green-50", icon: Smartphone },
  khalti: { label: "Khalti", color: "text-purple-700", bg: "bg-purple-50", icon: Smartphone },
  fonepay: { label: "FonePay", color: "text-blue-700", bg: "bg-blue-50", icon: Smartphone },
  netbanking: { label: "Net Banking", color: "text-indigo-700", bg: "bg-indigo-50", icon: Landmark },
  card: { label: "Card", color: "text-orange-700", bg: "bg-orange-50", icon: CreditCard },
  cash: { label: "Cash", color: "text-gray-700", bg: "bg-gray-50", icon: Banknote },
  bank: { label: "Bank", color: "text-blue-700", bg: "bg-blue-50", icon: Landmark },
};

function Pagination({
  total,
  perPage,
  page,
  onPage,
}: {
  total: number;
  perPage: number;
  page: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const windowStart = Math.floor((page - 1) / 10) * 10 + 1;
  const windowEnd = Math.min(totalPages, windowStart + 9);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
      >
        <span aria-hidden="true">←</span> Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`min-w-9.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
            p === page ? "bg-orange-500 text-white" : "text-gray-700 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
      >
        Next <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export default function AccountDetailClient({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "received" | "paid">("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/payments/accounts/${accountId}/transactions`);
        if (!res.ok) {
          throw new Error("Failed to load account details");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load account details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [accountId]);

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    
    let filtered = data.transactions;
    
    // Tab filter
    if (activeTab === "received") {
      filtered = filtered.filter((t) => 
        t.type === "cash_received" || t.type === "online_received"
      );
    } else if (activeTab === "paid") {
      filtered = filtered.filter((t) => 
        t.type === "cash_paid" || 
        t.type === "online_paid" || 
        t.type === "expense" || 
        t.type === "bank_transfer" || 
        t.type === "refund"
      );
    }
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.receivedFrom?.toLowerCase().includes(q) ||
        t.paidTo?.toLowerCase().includes(q) ||
        t.transactionId?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        typeConfig[t.type].label.toLowerCase().includes(q)
      );
    }
    
    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((t) => t.createdAt >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => t.createdAt <= dateTo);
    }
    
    return filtered;
  }, [data, activeTab, searchQuery, dateFrom, dateTo]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredTransactions.slice(start, start + PER_PAGE);
  }, [filteredTransactions, page]);

  const handleExport = (type: "csv" | "excel" | "pdf") => {
    window.open(
      `/api/exports/${type}?source=account-transactions&accountId=${accountId}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error || "Account not found"}</p>
          <button
            onClick={() => router.push("/dashboard/payment")}
            className="mt-4 text-orange-500 hover:underline"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const { account } = data;
  const mc = methodConfig[account.method] || methodConfig.esewa;
  const Icon = mc.icon;

  return (
    <div className="max-w-7xl mx-auto p-1 md:p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/payment")}
          className="p-2 rounded-xl bg-orange-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Account Transaction Details</h1>
          <p className="text-sm text-gray-400">View all transactions for this account</p>
        </div>
      </div>

      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex items-start gap-4">
          {account.qrCode && (
            <img 
              src={account.qrCode} 
              alt="QR Code" 
              className="w-20 h-20 rounded-lg object-contain border border-gray-100" 
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{account.accountName}</h2>
            <p className="text-sm text-gray-400">{account.holderName}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${mc.color} ${mc.bg}`}>
                <Icon size={12} /> {mc.label}
              </span>
               <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                account.status === "active" ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-100"
              }`}>
                {account.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className="text-sm text-gray-500 font-mono">{account.accountNumber}</span>
            </div>
          </div>
           {/* Export Dropdown */}
          <div className="">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleExport(e.target.value as "csv" | "excel" | "pdf");
                  e.target.value = "";
                }
              }}
              className="w-full bg-orange-500 text-white border-0 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Export</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>  
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <Wallet size={18} className="text-blue-600" />
          </div>
          <p className="text-gray-400 text-xs font-medium">Opening Balance</p>
          <h3 className="text-xl font-bold mt-0.5">Rs {Number(account.openingBalance).toLocaleString()}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <p className="text-gray-400 text-xs font-medium">Total Received</p>
          <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
            + Rs {account.totalReceived.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-3">
            <TrendingDown size={18} className="text-red-600" />
          </div>
          <p className="text-gray-400 text-xs font-medium">Total Paid</p>
          <h3 className="text-xl font-bold text-red-600 mt-0.5">
            - Rs {account.totalPaid.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
            <CreditCard size={18} className="text-orange-600" />
          </div>
          <p className="text-gray-400 text-xs font-medium">Closing Balance</p>
          <h3 className={`text-xl font-bold mt-0.5 ${
            account.closingBalance >= 0 ? "text-emerald-600" : "text-red-600"
          }`}>
            Rs {account.closingBalance.toLocaleString()}
          </h3>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 p-2"
      >
        <button
          onClick={() => { setActiveTab("all"); setPage(1); }}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-orange-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => { setActiveTab("received"); setPage(1); }}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "received"
              ? "bg-emerald-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Received Only
        </button>
        <button
          onClick={() => { setActiveTab("paid"); setPage(1); }}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "paid"
              ? "bg-red-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Paid Only
        </button>
      </motion.div>

      {/* Filters & Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Date From */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="From Date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="To Date"
            />
          </div>

        
        </div>

        {/* Clear Filters */}
        {(searchQuery || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="mt-3 text-sm text-orange-500 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Person</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Method</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Transaction ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((tx, i) => {
                const cfg = typeConfig[tx.type];
                const TxIcon = cfg.icon;
                const PayIcon = paymentIcons[tx.paymentMethod];
                const isReceived = tx.type === "cash_received" || tx.type === "online_received";
                
                return (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                        <TxIcon size={12} /> {cfg.label}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-sm text-right font-semibold ${isReceived ? "text-emerald-600" : "text-red-600"}`}>
                      {isReceived ? "+" : "-"} Rs {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {tx.enrichedPerson || tx.receivedFrom || tx.paidTo || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <PayIcon size={12} /> 
                        <span className="capitalize">{tx.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 font-mono">
                      {tx.transactionId || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {tx.notes || "-"}
                    </td>
                  </motion.tr>
                );
              })}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8 text-sm">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-50 flex flex-wrap items-center justify-between">
          <span className="text-xs text-gray-400">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </span>
          <Pagination total={filteredTransactions.length} perPage={PER_PAGE} page={page} onPage={setPage} />
        </div>
      </motion.div>
    </div>
  );
}
