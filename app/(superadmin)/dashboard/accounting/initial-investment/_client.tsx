"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Plus,
  X,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import PageNote from "../_components/PageNote";

interface Investment {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: string;
  amount: number;
  lines: {
    accountId: string;
    accountCode?: string;
    accountName?: string;
    debit: number;
    credit: number;
  }[];
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50" },
  posted: { label: "Posted", color: "text-emerald-700", bg: "bg-emerald-50" },
  voided: { label: "Voided", color: "text-red-700", bg: "bg-red-50" },
};

const formatCurrency = (v: number) => {
  if (v >= 10000000) return `Rs.${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `Rs.${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `Rs.${(v / 1000).toFixed(1)}K`;
  return `Rs.${v.toLocaleString()}`;
};

export default function InitialInvestmentPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [total, setTotal] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    date: new Date().toISOString().substring(0, 10),
    fundAccountCode: "1000",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [voidTarget, setVoidTarget] = useState<Investment | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounting/initial-investment").then((r) => r.json()),
      fetch("/api/accounting/chart-of-accounts").then((r) => r.json()),
    ])
      .then(([invData, acctData]) => {
        if (!invData.error) {
          setInvestments(invData.investments || []);
          setTotal(invData.total || 0);
        }
        if (!acctData.error) setAccounts(acctData.accounts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fundAccounts = accounts.filter(
    (a) => a.type === "asset" && a.isActive
  );

  async function refresh() {
    const d = await fetch("/api/accounting/initial-investment").then((r) =>
      r.json()
    );
    if (!d.error) {
      setInvestments(d.investments || []);
      setTotal(d.total || 0);
    }
  }

  async function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!form.amount || Number(form.amount) <= 0)
      errors.amount = "Enter an amount greater than zero";
    if (!form.date) errors.date = "Date is required";
    if (!form.fundAccountCode)
      errors.fundAccountCode = "Select the account being funded";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/initial-investment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          date: form.date,
          fundAccountCode: form.fundAccountCode,
          note: form.note,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record investment");
      }
      setForm({ ...form, amount: "", note: "" });
      setShowForm(false);
      await refresh();
      toast.success("Initial investment recorded and posted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record investment"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid() {
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }
    setVoiding(true);
    try {
      const res = await fetch("/api/accounting/initial-investment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: voidTarget.id, reason: voidReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to void investment");
      }
      setVoidTarget(null);
      setVoidReason("");
      await refresh();
      toast.success("Investment entry voided");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to void investment"
      );
    } finally {
      setVoiding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Initial Investment</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Record the opening capital you put into the business
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm"
        >
          <Plus size={16} />
          Record Investment
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <PiggyBank size={18} className="text-white" />
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Total Invested (Active)
          </p>
          <p className="text-xl font-bold mt-0.5">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {investments.filter((i) => i.status !== "voided").length} posted
            contribution(s)
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Record New Investment
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="e.g., 500000"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      formErrors.amount ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {formErrors.amount && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.amount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Fund Account *
                  </label>
                  <select
                    value={form.fundAccountCode}
                    onChange={(e) =>
                      setForm({ ...form, fundAccountCode: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    {fundAccounts.length === 0 && <option value="">No asset accounts</option>}
                    {fundAccounts.map((a) => (
                      <option key={a.id} value={a.code}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Note
                  </label>
                  <input
                    value={form.note}
                    onChange={(e) =>
                      setForm({ ...form, note: e.target.value })
                    }
                    placeholder="e.g., Owner capital - kitchen setup"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm disabled:opacity-50"
                >
                  {saving ? "Recording..." : "Record & Post"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shadow-md">
              <PiggyBank size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Investment History</h3>
              <p className="text-xs text-gray-400">
                {investments.length} contribution(s)
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Entry
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Description
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Amount
                </th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const sc = statusConfig[inv.status] || statusConfig.draft;
                const fundLine = inv.lines.find((l) => l.debit > 0);
                return (
                  <tr
                    key={inv.id}
                    className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
                      inv.status === "voided" ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono font-medium text-gray-700">
                        {inv.entryNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {inv.date}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <span className="text-sm font-medium">
                          {inv.description}
                        </span>
                        {fundLine && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Into {fundLine.accountName} ({fundLine.accountCode})
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color} ${sc.bg}`}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.status === "posted" && (
                        <button
                          onClick={() => setVoidTarget(inv)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                          title="Void"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {investments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <PiggyBank size={24} className="text-amber-500" />
                      </div>
                      <p className="text-sm text-gray-400">
                        No investment recorded yet. Click &quot;Record
                        Investment&quot; to add your opening capital.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {voidTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setVoidTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert size={18} className="text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Void Investment Entry
                </h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Void entry {voidTarget.entryNumber} of{" "}
                {formatCurrency(voidTarget.amount)}? This reverses the balances
                on the linked accounts.
              </p>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Reason *
              </label>
              <input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Why are you voiding this entry?"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 mb-5"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setVoidTarget(null);
                    setVoidReason("");
                  }}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVoid}
                  disabled={voiding}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all text-sm disabled:opacity-50"
                >
                  {voiding ? "Voiding..." : "Void Entry"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageNote
        points={[
          "Records your opening capital as a posted journal entry: Debit the fund account (Cash or Bank), Credit Owner's Equity.",
          "Enter the amount you invested, the date, the account the money went into, and an optional note.",
          "Each recorded investment is immediately reflected in the Balance Sheet (assets & equity), Cash Flow (financing) and the trial balance.",
          "The entry also appears in Journal Entries with an 'initial_investment' reference and can be voided here or from that page.",
        ]}
      />
    </div>
  );
}
