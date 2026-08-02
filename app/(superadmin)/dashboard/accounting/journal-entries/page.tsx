"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  X,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/lib/permission-context";
import { toast } from "react-hot-toast";
import PageNote from "../_components/PageNote";

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  totalDebit: string;
  totalCredit: string;
  voidReason: string | null;
  createdAt: string;
  lines?: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string | null;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50" },
  posted: { label: "Posted", color: "text-emerald-700", bg: "bg-emerald-50" },
  voided: { label: "Voided", color: "text-red-700", bg: "bg-red-50" },
};

const sourceConfig: Record<
  string,
  { label: string; href: string; color: string; bg: string }
> = {
  initial_investment: {
    label: "Initial Investment",
    href: "/dashboard/accounting/initial-investment",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  order: {
    label: "Order Sale",
    href: "/dashboard/orders",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  order_payment: {
    label: "Customer Payment",
    href: "/dashboard/payment",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  supplier_purchase: {
    label: "Supplier Purchase",
    href: "/dashboard/suppliers",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  supplier_payment: {
    label: "Supplier Payment",
    href: "/dashboard/suppliers",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  payment_cash_received: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_online_received: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_cash_paid: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_online_paid: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_expense: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_bank_transfer: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  payment_refund: {
    label: "Payments",
    href: "/dashboard/payment",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
};

const MANUAL_SOURCE = {
  label: "Manual Entry",
  href: "/dashboard/accounting/journal-entries",
  color: "text-gray-700",
  bg: "bg-gray-100",
};

function getSource(refType: string | null) {
  if (!refType) return MANUAL_SOURCE;
  if (
    refType.startsWith("supplier_purchase_rect") ||
    refType.startsWith("supplier_settlement_rect")
  ) {
    return {
      label: "Supplier Adjustment",
      href: "/dashboard/suppliers",
      color: "text-fuchsia-700",
      bg: "bg-fuchsia-50",
    };
  }
  return sourceConfig[refType] || MANUAL_SOURCE;
}

export default function JournalEntriesPage() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [showVoidModal, setShowVoidModal] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    description: "",
    lines: [
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchStartDate = searchParams.get("startDate");
  const searchEndDate = searchParams.get("endDate");
  const searchAccountId = searchParams.get("accountId");

  const urlParams = useMemo(
    () => ({
      ...(searchStartDate ? { startDate: searchStartDate } : {}),
      ...(searchEndDate ? { endDate: searchEndDate } : {}),
      ...(searchAccountId ? { accountId: searchAccountId } : {}),
    }),
    [searchStartDate, searchEndDate, searchAccountId]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (urlParams.startDate) params.set("startDate", urlParams.startDate);
    if (urlParams.endDate) params.set("endDate", urlParams.endDate);
    if (urlParams.accountId) params.set("accountId", urlParams.accountId);
    Promise.all([
      fetch(`/api/accounting/journal-entries?${params.toString()}`).then((r) =>
        r.json()
      ),
      fetch("/api/accounting/chart-of-accounts").then((r) => r.json()),
    ])
      .then(([entriesData, accountsData]) => {
        if (!entriesData.error) setEntries(entriesData.entries || []);
        if (!accountsData.error) setAccounts(accountsData.accounts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [urlParams]);

  const filteredAccount = useMemo(
    () =>
      urlParams.accountId
        ? accounts.find((a) => a.id === urlParams.accountId)
        : undefined,
    [urlParams.accountId, accounts]
  );

  function navigateWithParams(next: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }) {
    const sp = new URLSearchParams();
    if (next.startDate) sp.set("startDate", next.startDate);
    if (next.endDate) sp.set("endDate", next.endDate);
    if (next.accountId) sp.set("accountId", next.accountId);
    const qs = sp.toString();
    router.replace(qs ? `/dashboard/accounting/journal-entries?${qs}` : "/dashboard/accounting/journal-entries");
  }

  function clearUrlFilters() {
    navigateWithParams({});
  }

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      const matchesSearch =
        !q ||
        e.entryNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [entries, search, statusFilter]);

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { accountId: "", debit: "", credit: "", description: "" },
      ],
    }));
  }

  function removeLine(index: number) {
    if (form.lines.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }

  function updateLine(
    index: number,
    field: string,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    }));
  }

  const totalDebit = form.lines.reduce(
    (sum, line) => sum + Number(line.debit || 0),
    0
  );
  const totalCredit = form.lines.reduce(
    (sum, line) => sum + Number(line.credit || 0),
    0
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  async function handleCreate() {
    const errors: Record<string, string> = {};
    if (!form.date) errors.date = "Date is required";
    if (!form.description.trim())
      errors.description = "Description is required";
    if (form.lines.length < 2)
      errors.lines = "At least 2 lines are required";

    form.lines.forEach((line, i) => {
      if (!line.accountId)
        errors[`line_${i}_account`] = "Account is required";
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (debit === 0 && credit === 0)
        errors[`line_${i}_amount`] = "Either debit or credit is required";
      if (debit > 0 && credit > 0)
        errors[`line_${i}_both`] = "Cannot have both debit and credit";
    });

    if (!isBalanced) errors.balanced = "Debit and Credit must be equal";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      const res = await fetch("/api/accounting/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          description: form.description,
          lines: form.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit || "0",
            credit: line.credit || "0",
            description: line.description,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create journal entry");
      }

      setShowForm(false);
      setForm({
        date: new Date().toISOString().substring(0, 10),
        description: "",
        lines: [
          { accountId: "", debit: "", credit: "", description: "" },
          { accountId: "", debit: "", credit: "", description: "" },
        ],
      });

      const entriesData = await fetch("/api/accounting/journal-entries").then(
        (r) => r.json()
      );
      if (!entriesData.error) setEntries(entriesData.entries || []);
      toast.success("Journal entry created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create journal entry"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(id: string) {
    if (!confirm("Post this journal entry? This will update account balances."))
      return;
    try {
      const res = await fetch(
        `/api/accounting/journal-entries/${id}/post`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to post entry");
      }
      const entriesData = await fetch("/api/accounting/journal-entries").then(
        (r) => r.json()
      );
      if (!entriesData.error) setEntries(entriesData.entries || []);
      toast.success("Journal entry posted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post entry");
    }
  }

  async function handleVoid(id: string) {
    if (!voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }
    try {
      const res = await fetch(
        `/api/accounting/journal-entries/${id}/void`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: voidReason }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to void entry");
      }
      setShowVoidModal(null);
      setVoidReason("");
      const entriesData = await fetch("/api/accounting/journal-entries").then(
        (r) => r.json()
      );
      if (!entriesData.error) setEntries(entriesData.entries || []);
      toast.success("Journal entry voided successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void entry");
    }
  }

  async function viewEntry(id: string) {
    try {
      const res = await fetch(`/api/accounting/journal-entries/${id}`);
      const data = await res.json();
      if (!data.error) setViewingEntry(data.entry);
    } catch {
      toast.error("Failed to load entry details");
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
          <h2 className="text-xl font-bold text-gray-900">Journal Entries</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Double-entry bookkeeping records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              placeholder="Search entries..."
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 w-full sm:w-56 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="voided">Voided</option>
          </select>
          {can("CREATE_ACCOUNTING") && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm"
            >
              <Plus size={16} />
              New Entry
            </button>
          )}
        </div>
      </div>

      {(urlParams.accountId ||
        urlParams.startDate ||
        urlParams.endDate) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">
            Filtered by:
          </span>
          {urlParams.accountId && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700">
              Account: {filteredAccount?.name || urlParams.accountId}
              <button
                onClick={() =>
                  navigateWithParams({
                    ...urlParams,
                    accountId: undefined,
                  })
                }
                className="hover:text-orange-900"
                title="Remove account filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {urlParams.startDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
              From: {urlParams.startDate}
              <button
                onClick={() =>
                  navigateWithParams({
                    ...urlParams,
                    startDate: undefined,
                  })
                }
                className="hover:text-blue-900"
                title="Remove start date filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {urlParams.endDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
              To: {urlParams.endDate}
              <button
                onClick={() =>
                  navigateWithParams({
                    ...urlParams,
                    endDate: undefined,
                  })
                }
                className="hover:text-blue-900"
                title="Remove end date filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={clearUrlFilters}
            className="text-xs font-medium text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            Clear all filters
          </button>
        </div>
      )}

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
                  New Journal Entry
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
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
                    Description *
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Enter description"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      formErrors.description
                        ? "border-red-400"
                        : "border-gray-200"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">
                    Entry Lines *
                  </label>
                  <button
                    onClick={addLine}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    + Add Line
                  </button>
                </div>
                <div className="space-y-2">
                  {form.lines.map((line, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 items-start"
                    >
                      <div className="col-span-4">
                        <select
                          value={line.accountId}
                          onChange={(e) =>
                            updateLine(i, "accountId", e.target.value)
                          }
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                            formErrors[`line_${i}_account`]
                              ? "border-red-400"
                              : "border-gray-200"
                          }`}
                        >
                          <option value="">Select Account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Debit"
                          value={line.debit}
                          onChange={(e) =>
                            updateLine(i, "debit", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Credit"
                          value={line.credit}
                          onChange={(e) =>
                            updateLine(i, "credit", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          placeholder="Note"
                          value={line.description}
                          onChange={(e) =>
                            updateLine(i, "description", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                      <div className="col-span-1">
                        {form.lines.length > 2 && (
                          <button
                            onClick={() => removeLine(i)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex gap-6 text-sm">
                  <span>
                    Total Debit:{" "}
                    <strong className="text-emerald-600">
                      Rs.{totalDebit.toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    Total Credit:{" "}
                    <strong className="text-red-600">
                      Rs.{totalCredit.toLocaleString()}
                    </strong>
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    isBalanced ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isBalanced ? "Balanced" : "Not Balanced"}
                </span>
              </div>

              {formErrors.balanced && (
                <p className="text-xs text-red-500 mb-2">
                  {formErrors.balanced}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={saving || !isBalanced}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Entry"}
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
        className="bg-white rounded-2xl border border-gray-100"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Entry #
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Description
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Source
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Debit
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Credit
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const sc = statusConfig[entry.status] || statusConfig.draft;
                const source = getSource(entry.referenceType);
                const isSourceLink =
                  source.href !== "/dashboard/accounting/journal-entries";
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium">
                        {entry.entryNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {entry.date}
                    </td>
                    <td className="px-5 py-4 text-sm max-w-50 truncate">
                      {entry.description}
                    </td>
                    <td className="px-5 py-4">
                      {isSourceLink ? (
                        <Link
                          href={source.href}
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${source.color} ${source.bg} hover:opacity-80 transition-opacity`}
                          title={`View in ${source.label}`}
                        >
                          {source.label}
                        </Link>
                      ) : (
                        <span
                          className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full ${source.color} ${source.bg}`}
                        >
                          {source.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-emerald-600">
                      Rs.{Number(entry.totalDebit).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-red-600">
                      Rs.{Number(entry.totalCredit).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color} ${sc.bg}`}
                      >
                        {sc.label}
                      </span>
                      {entry.voidReason && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-37.5 truncate">
                          Reason: {entry.voidReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewEntry(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {can("UPDATE_ACCOUNTING") &&
                          entry.status === "draft" && (
                            <button
                              onClick={() => handlePost(entry.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Post Entry"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        {can("UPDATE_ACCOUNTING") &&
                          entry.status !== "voided" && (
                            <button
                              onClick={() => setShowVoidModal(entry.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Void Entry"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-gray-400 py-12 text-sm"
                  >
                    No journal entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {viewingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setViewingEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-orange-500" />
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {viewingEntry.entryNumber}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {viewingEntry.date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm font-medium">
                    {viewingEntry.description}
                  </p>
                </div>
                {viewingEntry.voidReason && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-red-500 font-medium">
                      Void Reason
                    </p>
                    <p className="text-sm text-red-700">
                      {viewingEntry.voidReason}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Entry Lines</p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 py-2">
                          Account
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-400 py-2">
                          Debit
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-400 py-2">
                          Credit
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-2">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingEntry.lines?.map((line) => {
                        const account = accounts.find(
                          (a) => a.id === line.accountId
                        );
                        return (
                          <tr
                            key={line.id}
                            className="border-b border-gray-50"
                          >
                            <td className="py-2 text-sm">
                              {account
                                ? `${account.code} - ${account.name}`
                                : line.accountId}
                            </td>
                            <td className="py-2 text-sm text-right text-emerald-600">
                              {Number(line.debit) > 0
                                ? `Rs.${Number(line.debit).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="py-2 text-sm text-right text-red-600">
                              {Number(line.credit) > 0
                                ? `Rs.${Number(line.credit).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="py-2 text-sm text-gray-500">
                              {line.description || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td className="py-2 text-sm font-bold">Total</td>
                        <td className="py-2 text-sm text-right font-bold text-emerald-600">
                          Rs.
                          {Number(
                            viewingEntry.totalDebit
                          ).toLocaleString()}
                        </td>
                        <td className="py-2 text-sm text-right font-bold text-red-600">
                          Rs.
                          {Number(
                            viewingEntry.totalCredit
                          ).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowVoidModal(null);
              setVoidReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Void Journal Entry</h3>
                <button
                  onClick={() => {
                    setShowVoidModal(null);
                    setVoidReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Please provide a reason for voiding this journal entry. This
                  action cannot be undone.
                </p>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 h-24 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVoid(showVoidModal)}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all text-sm"
                  >
                    Void Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowVoidModal(null);
                      setVoidReason("");
                    }}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageNote
        points={[
          "Shows all double-entry journal entries with Entry #, Date, Description, Debit, Credit and Status.",
          "The Source column identifies where each entry came from (Orders, Payments, Suppliers, Initial Investment) and links back to that screen.",
          "Status can be Draft, Posted or Voided; only Draft entries can be posted or voided.",
          "Create a new entry by adding at least two lines where total Debit must equal total Credit.",
          "Posting an entry updates the balances of the related accounts in the Chart of Accounts and all statements.",
          "Open the page with ?accountId=, ?startDate= and ?endDate= to see the ledger for a specific account or period.",
          "Voiding requires a reason and marks the entry as Voided without altering posted history.",
        ]}
      />
    </div>
  );
}
