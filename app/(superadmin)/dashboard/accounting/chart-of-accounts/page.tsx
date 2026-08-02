"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/permission-context";
import { toast } from "react-hot-toast";
import PageNote from "../_components/PageNote";
import { useConfirm } from "@/app/_components/ConfirmPopup";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  subType: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  openingBalance: string;
  balance: string;
  createdAt: string;
}

const typeOptions = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

const subTypeOptions: Record<string, { value: string; label: string }[]> = {
  asset: [
    { value: "current_asset", label: "Current Asset" },
    { value: "fixed_asset", label: "Fixed Asset" },
  ],
  liability: [
    { value: "current_liability", label: "Current Liability" },
    { value: "long_term_liability", label: "Long-term Liability" },
  ],
  equity: [{ value: "equity", label: "Equity" }],
  revenue: [{ value: "revenue", label: "Revenue" }],
  expense: [
    { value: "cogs", label: "Cost of Goods Sold" },
    { value: "operating_expense", label: "Operating Expense" },
    { value: "non_operating_expense", label: "Non-Operating Expense" },
  ],
};

const typeConfig: Record<string, { color: string; bg: string }> = {
  asset: { color: "text-blue-700", bg: "bg-blue-50" },
  liability: { color: "text-red-700", bg: "bg-red-50" },
  equity: { color: "text-purple-700", bg: "bg-purple-50" },
  revenue: { color: "text-emerald-700", bg: "bg-emerald-50" },
  expense: { color: "text-orange-700", bg: "bg-orange-50" },
};

const formatCurrency = (v: number) => `Rs.${Math.abs(v).toLocaleString("en-IN")}`;

const defaultForm = {
  code: "",
  name: "",
  type: "asset",
  subType: "current_asset",
  description: "",
  parentId: "",
  openingBalance: "0",
};

export default function ChartOfAccountsPage() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    asset: true,
    liability: true,
    equity: true,
    revenue: true,
    expense: true,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  function fetchAccounts() {
    fetch("/api/accounting/chart-of-accounts")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setAccounts(d.accounts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        !q ||
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.subType.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };
    for (const account of filteredAccounts) {
      if (groups[account.type]) {
        groups[account.type].push(account);
      }
    }
    return groups;
  }, [filteredAccounts]);

  function openAddForm(type?: string) {
    setForm({ ...defaultForm, type: type || "asset", subType: subTypeOptions[type || "asset"][0].value });
    setEditingAccount(null);
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(account: Account) {
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      subType: account.subType,
      description: account.description || "",
      parentId: account.parentId || "",
      openingBalance: account.openingBalance,
    });
    setEditingAccount(account);
    setFormErrors({});
    setShowForm(true);
  }

  async function handleSave() {
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = "Code is required";
    if (!form.name.trim()) errors.name = "Name is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    try {
      const url = editingAccount
        ? `/api/accounting/chart-of-accounts/${editingAccount.id}`
        : "/api/accounting/chart-of-accounts";
      const method = editingAccount ? "PATCH" : "POST";

      const body: Record<string, string> = {
        code: form.code,
        name: form.name,
        type: form.type,
        subType: form.subType,
        openingBalance: form.openingBalance,
      };
      if (form.description) body.description = form.description;
      if (form.parentId) body.parentId = form.parentId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save account");
      }

      setShowForm(false);
      setEditingAccount(null);
      setForm(defaultForm);
      fetchAccounts();
      toast.success(
        editingAccount ? "Account updated successfully" : "Account created successfully"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: Account) {
    const ok = await confirm({
      title: "Delete Account",
      message: `Delete account "${account.name}" (${account.code})? This cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(
        `/api/accounting/chart-of-accounts/${account.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete account");
      }
      fetchAccounts();
      toast.success("Account deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  }

  async function handleToggleActive(account: Account) {
    try {
      const res = await fetch(
        `/api/accounting/chart-of-accounts/${account.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !account.isActive }),
        }
      );
      if (!res.ok) throw new Error("Failed to update account");
      fetchAccounts();
      toast.success(
        account.isActive ? "Account deactivated" : "Account activated"
      );
    } catch {
      toast.error("Failed to update account");
    }
  }

  function toggleType(type: string) {
    setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
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
          <h2 className="text-xl font-bold text-gray-900">Chart of Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your account categories and structure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              placeholder="Search accounts..."
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 w-full sm:w-64 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {can("CREATE_ACCOUNTING") && (
            <button
              onClick={() => openAddForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm"
            >
              <Plus size={16} />
              Add Account
            </button>
          )}
        </div>
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
                  {editingAccount ? "Edit Account" : "New Account"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Account Code *
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    placeholder="e.g., 1000"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      formErrors.code ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {formErrors.code && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.code}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Account Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g., Cash on Hand"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                      formErrors.name ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Account Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm({
                        ...form,
                        type,
                        subType: subTypeOptions[type][0].value,
                      });
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Sub-Type *
                  </label>
                  <select
                    value={form.subType}
                    onChange={(e) =>
                      setForm({ ...form, subType: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    {(subTypeOptions[form.type] || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    value={form.openingBalance}
                    onChange={(e) =>
                      setForm({ ...form, openingBalance: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Parent Account
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) =>
                      setForm({ ...form, parentId: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    <option value="">None (Top Level)</option>
                    {accounts
                      .filter((a) => a.id !== editingAccount?.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Description
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingAccount ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {Object.entries(groupedAccounts).map(([type, accounts]) => {
        const tc = typeConfig[type];
        const isExpanded = expandedTypes[type];
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() => toggleType(type)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center`}
                >
                  <BookOpen size={14} className={tc.color} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm capitalize">{type}s</h3>
                  <p className="text-xs text-gray-400">
                    {accounts.length} accounts
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {isExpanded && accounts.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-50">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Code
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Name
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Sub-Type
                          </th>
                          <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Balance
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Status
                          </th>
                          <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr
                            key={account.id}
                            className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
                              !account.isActive ? "opacity-50" : ""
                            }`}
                          >
                            <td className="px-5 py-3">
                              <span className="text-sm font-mono font-medium text-gray-700">
                                {account.code}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div>
                                <Link
                                  href={`/dashboard/accounting/journal-entries?accountId=${account.id}`}
                                  className="text-sm font-medium hover:text-orange-600 transition-colors"
                                  title="View journal entries for this account"
                                >
                                  {account.name}
                                </Link>
                                {account.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {account.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs text-gray-500 capitalize">
                                {account.subType.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span
                                className={`text-sm font-semibold font-mono ${
                                  Number(account.balance) >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number(account.balance) === 0
                                  ? "—"
                                  : `${Number(account.balance) < 0 ? "-" : ""}${formatCurrency(
                                      Number(account.balance)
                                    )}`}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  account.isActive
                                    ? "text-emerald-700 bg-emerald-50"
                                    : "text-gray-500 bg-gray-100"
                                }`}
                              >
                                {account.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {can("UPDATE_ACCOUNTING") && (
                                  <>
                                    <button
                                      onClick={() => openEditForm(account)}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-500 hover:text-gray-600 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleToggleActive(account)}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-green-500 hover:text-gray-600 transition-colors"
                                      title={
                                        account.isActive
                                          ? "Deactivate"
                                          : "Activate"
                                      }
                                    >
                                      <Power size={18} />
                                    </button>
                                  </>
                                )}
                                {can("DELETE_ACCOUNTING") && (
                                  <button
                                    onClick={() => handleDelete(account)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {isExpanded && accounts.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm border-t border-gray-50">
                No {type} accounts found
              </div>
            )}
          </motion.div>
        );
      })}

      {filteredAccounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
            <BookOpen size={32} className="text-orange-500" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No Accounts Found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {search
                ? "Try a different search term"
                : "Create your first account to get started"}
            </p>
          </div>
          {can("CREATE_ACCOUNTING") && !search && (
            <button
              onClick={() => openAddForm()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-sm"
            >
              Create First Account
            </button>
          )}
        </div>
      )}

      <PageNote
        points={[
          "Lists every ledger account grouped by type: Assets, Liabilities, Equity, Revenue and Expense.",
          "Each row shows the account Code, Name, Sub-Type, current Balance, and Active/Inactive status.",
          "The Balance column reflects the cumulative ledger position for each account, synced from posted journal entries.",
          "Click an account name to jump to its journal entries (ledger) for full traceability.",
          "Add a new account, or edit an existing one, to define its code, type, opening balance and parent.",
          "Toggle Active/Inactive to include or exclude an account from statements without deleting it.",
          "Deleting an account is permanent and only allowed when it has no dependent transactions.",
        ]}
      />
    </div>
  );
}
