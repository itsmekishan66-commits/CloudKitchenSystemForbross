"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { usePermissions } from "@/lib/permission-context";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  total: string;
  status: string;
  paymentSettled?: number | boolean | null;
  dueAmount?: string | null;
  items: OrderItem[];
}

interface PaymentAccount {
  id: string;
  accountName: string;
  holderName: string;
  method: string;
  accountNumber: string;
  closingBalance: number;
  qrCode: string | null;
  status: string;
}

export default function SettlePaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const permissions = usePermissions();
  const hasSettleAccess = permissions.includes("CREATE_PAYMENTS") || permissions.includes("UPDATE_PAYMENTS");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [onlineMethod, setOnlineMethod] = useState("esewa");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [discount, setDiscount] = useState("");
  const [markAsDue, setMarkAsDue] = useState(false);
  const [duePersonName, setDuePersonName] = useState("");
  const [dueRole, setDueRole] = useState<"customer" | "supplier" | "staff">("customer");



  useEffect(() => {
    if (!orderId) return;
    if (!hasSettleAccess) {
      router.push("/dashboard/orders");
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.order) {
          router.push("/dashboard/orders");
          return;
        }
        const o = data.order;
        if (o.status !== "Delivered") {
          router.push("/dashboard/orders");
          return;
        }
        if (o.paymentSettled) {
          router.push("/dashboard/orders");
          return;
        }
        setOrder(o);
        const dueAmt = Number(o.dueAmount);
        setCashAmount(dueAmt > 0 ? dueAmt.toFixed(2) : Number(o.total).toFixed(2));
      })
      .catch(() => router.push("/dashboard/orders"))
      .finally(() => setLoading(false));

    fetch("/api/payments/accounts")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.accounts || []).filter((a: PaymentAccount) => a.status === "active");
        setAccounts(active);
      })
      .catch(() => {});
  }, [orderId, router, hasSettleAccess]);

  const total = Number(order?.total || 0);
  const dueAmt = Number(order?.dueAmount || 0);
  const hasDue = dueAmt > 0;
  const cashVal = Number(cashAmount) || 0;
  const onlineVal = Number(onlineAmount) || 0;
  const discountVal = Number(discount) || 0;
  const received = cashVal + onlineVal;
  const base = hasDue ? dueAmt : total;
  const remaining = base - received - discountVal;
  const overpayment = Math.max(0, received - base);

  async function handleSubmit() {
    if (received <= 0 && !markAsDue) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          cashAmount: cashVal,
          onlineAmount: onlineVal,
          paymentMethod: onlineMethod,
          accountId: accountId || undefined,
          discount: discountVal,
          markAsDue,
          dueAmount: markAsDue ? remaining : 0,
          duePersonName: markAsDue ? duePersonName : undefined,
          dueRole: markAsDue ? dueRole : undefined,
          overpayment: overpayment > 0 ? overpayment : 0,
        }),
      });
      if (!res.ok) throw new Error("Settlement failed");
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to settle payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

 if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="text-red-500 text-sm">Order not found.</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Settled!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Order #{order.id} — Payment has been recorded successfully.
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 rounded-xl p-4 mb-6">
            {cashVal > 0 && <div className="flex justify-between"><span>Cash</span><span className="font-semibold">Rs {cashVal.toLocaleString()}</span></div>}
            {onlineVal > 0 && <div className="flex justify-between"><span>Online ({onlineMethod})</span><span className="font-semibold">Rs {onlineVal.toLocaleString()}</span></div>}
            {discountVal > 0 && <div className="flex justify-between text-orange-600"><span>Discount</span><span className="font-semibold">- Rs {discountVal.toLocaleString()}</span></div>}
            {markAsDue && remaining > 0 && <div className="flex justify-between text-amber-600"><span>Marked as Due</span><span className="font-semibold">Rs {remaining.toLocaleString()}</span></div>}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/orders")}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Back to Orders
            </button>
            <button
              onClick={() => router.push("/dashboard/payment")}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm text-white hover:bg-orange-600"
            >
              View Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settle Payment</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {Number(order.dueAmount) > 0
              ? `Record payment for Order #${order.id} — Remaining due: Rs ${Number(order.dueAmount).toFixed(2)}`
              : `Record payment for Order #${order.id}`}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Customer:</span>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>
              <p className="font-medium">{order.phone}</p>
            </div>
            <div>
              <span className="text-gray-400">Payment Method:</span>
              <p className="font-medium capitalize">{order.paymentMethod.toLowerCase()}</p>
            </div>
            <div>
              <span className="text-gray-400">Order Total:</span>
              <p className="font-bold text-lg">Rs {order.total}</p>
            </div>
            {Number(order.dueAmount) > 0 && (
              <div>
                <span className="text-gray-400">Remaining Due:</span>
                <p className="font-bold text-lg text-amber-600">Rs {Number(order.dueAmount).toFixed(2)}</p>
              </div>
            )}
          </div>
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View items</summary>
            <div className="mt-2 space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span>{item.title} × {item.quantity}</span>
                  <span>Rs {(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Settlement Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-sm">Payment Breakdown</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cash Amount (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={cashAmount}
                onChange={(e) => {
                  setCashAmount(e.target.value);
                  if (markAsDue && !e.target.value) setMarkAsDue(false);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Online Amount (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={onlineAmount}
                onChange={(e) => setOnlineAmount(e.target.value)}
              />
            </div>
          </div>

          {Number(onlineAmount) > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Account</label>
              {accounts.length > 0 ? (
                <select
                  value={accountId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAccountId(id);
                    const acc = accounts.find((a) => a.id === id);
                    if (acc) setOnlineMethod(acc.method);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="">-- Select account --</option>
                  {(["esewa", "khalti", "netbanking", "card"] as const).map((method) => {
                    const methodAccounts = accounts.filter((a) => a.method === method);
                    if (methodAccounts.length === 0) return null;
                    const methodLabel = method === "netbanking" ? "Net Banking" : method.charAt(0).toUpperCase() + method.slice(1);
                    return (
                      <optgroup key={method} label={methodLabel}>
                        {methodAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.accountName} ({a.accountNumber})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              ) : (
                <div className="space-y-2">
                  <select
                    value={onlineMethod}
                    onChange={(e) => setOnlineMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="card">Card</option>
                  </select>
                  <p className="text-xs text-gray-400">No payment accounts configured. <a href="/dashboard/payment/accounts" className="text-orange-500 hover:underline">Add one</a></p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Discount (Rs)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          {/* Running total */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Total</span>
              <span className="font-semibold">Rs {total.toFixed(2)}</span>
            </div>
            {hasDue && (
              <div className="flex justify-between text-amber-600">
                <span>Due Amount</span>
                <span className="font-semibold">Rs {dueAmt.toFixed(2)}</span>
              </div>
            )}
            {cashVal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Cash</span>
                <span>- Rs {cashVal.toFixed(2)}</span>
              </div>
            )}
            {onlineVal > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Online ({accountId ? accounts.find((a) => a.id === accountId)?.accountName || onlineMethod : onlineMethod})</span>
                <span>- Rs {onlineVal.toFixed(2)}</span>
              </div>
            )}
            {discountVal > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Discount</span>
                <span>- Rs {discountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1.5 border-t border-gray-200">
              <span>Remaining</span>
              <span className={remaining > 0 ? "text-amber-600" : "text-emerald-600"}>
                {overpayment > 0 ? "Rs 0" : `Rs ${remaining.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Overpayment notice */}
          {overpayment > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-700">
                Customer overpaid by Rs {overpayment.toFixed(2)} — will be credited to customer balance
              </p>
            </div>
          )}

          {/* Mark as Due */}
          {remaining > 0 && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={markAsDue}
                onChange={(e) => setMarkAsDue(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              <span className="text-sm font-medium text-gray-700">Mark remaining Rs {remaining.toFixed(2)} as Due (Receivable)</span>
            </label>
          )}

          {markAsDue && (
            <div className="grid sm:grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Person Name</label>
                <input
                  type="text"
                  placeholder={order.customerName}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={duePersonName}
                  onChange={(e) => setDuePersonName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={dueRole}
                  onChange={(e) => setDueRole(e.target.value as "customer" | "supplier" | "staff")}
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          )}

          {accountId && (() => {
            const selected = accounts.find((a) => a.id === accountId);
            if (!selected?.qrCode) return null;
            return (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-xs text-gray-500 mb-2 font-medium">Scan QR to pay — {selected.accountName}</p>
                <img src={selected.qrCode} alt="QR Code" className="w-48 h-48 object-contain rounded-lg" />
                <p className="text-xs text-gray-400 mt-2">{selected.accountNumber}</p>
              </div>
            );
          })()}

          <button
            onClick={handleSubmit}
            disabled={submitting || (received <= 0 && !markAsDue)}
            className="w-full bg-orange-500 text-white font-semibold rounded-xl py-3 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Settling..." : "Confirm Settlement"}
          </button>
        </div>
      </div>
    </div>
  );
}
