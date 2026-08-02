"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Scale, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import PageNote from "../_components/PageNote";

interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

const formatCurrency = (v: number) => `Rs.${v.toLocaleString("en-IN")}`;

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/accounting/trial-balance?asOfDate=${asOfDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (!d.error) {
          setData(d);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [asOfDate]);

  const loading = data === null && !error;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load trial balance</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trial Balance</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Debit and credit balances of every account as of the selected date
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="date"
            value={asOfDate}
            max={new Date().toISOString().substring(0, 10)}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Trial Balance
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                As of {data.asOfDate}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              data.isBalanced
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {data.isBalanced ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {data.isBalanced ? "Balanced" : "Out of Balance"}
          </div>
        </div>

        {data.accounts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No account balances to show yet. Record transactions or an
              initial investment to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Account</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold text-right">
                    Debit
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.accounts.map((account) => (
                  <tr key={account.code} className="hover:bg-orange-50/40">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {account.code}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <Link
                        href={`/dashboard/accounting/journal-entries?accountId=${account.id}`}
                        className="hover:text-orange-600 transition-colors"
                        title="View journal entries for this account"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-emerald-600">
                      {account.debit > 0 ? formatCurrency(account.debit) : "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-red-600">
                      {account.credit > 0 ? formatCurrency(account.credit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-100">
                  <td className="px-6 py-3" colSpan={3}>
                    Totals
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-emerald-600">
                    {formatCurrency(data.totalDebit)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-red-600">
                    {formatCurrency(data.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>

      <PageNote
        points={[
          "Lists the net debit/credit balance of every account in the chart of accounts as of the selected date.",
          "A balanced trial balance means total debits equal total credits, verifying the accounting entries.",
          "Voided journal entries are excluded so the trial balance reflects only valid posted entries.",
          "Use the date picker to view the trial balance at any point in the past.",
          "Click an account name to open its journal entries in the Journal Entries tab.",
        ]}
      />
    </div>
  );
}
