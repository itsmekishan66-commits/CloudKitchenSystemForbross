"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, CreditCard, Landmark, Smartphone } from "lucide-react";
import { usePermissions } from "@/lib/permission-context";

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
  items: OrderItem[];
}

const onlineMethodIcons: Record<string, typeof CreditCard> = {
  esewa: Smartphone,
  khalti: Smartphone,
  card: CreditCard,
  bank: Landmark,
};

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
        setCashAmount(Number(o.total).toFixed(2));
      })
      .catch(() => router.push("/dashboard/orders"))
      .finally(() => setLoading(false));
  }, [orderId, router, hasSettleAccess]);

  const total = Number(order?.total || 0);
  const cashVal = Number(cashAmount) || 0;
  const onlineVal = Number(onlineAmount) || 0;
  const discountVal = Number(discount) || 0;
  const received = cashVal + onlineVal;
  const remaining = total - received - discountVal;

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
          discount: discountVal,
          markAsDue,
          dueAmount: markAsDue ? remaining : 0,
          duePersonName: markAsDue ? duePersonName : undefined,
          dueRole: markAsDue ? dueRole : undefined,
        }),
      });
      if (!res.ok) throw new Error("Settlement failed");
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Failed to settle payment. Please try again.");
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
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-red-500 text-sm">Order not found.</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 text-center">
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
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settle Payment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record payment for Order #{order.id}</p>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Online Payment Method</label>
              <div className="flex gap-2">
                {["esewa", "khalti", "card", "bank"].map((m) => {
                  const Icon = onlineMethodIcons[m] || Smartphone;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOnlineMethod(m)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition-all ${onlineMethod === m ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Icon size={14} />
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  );
                })}
              </div>
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
            {cashVal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Cash</span>
                <span>- Rs {cashVal.toFixed(2)}</span>
              </div>
            )}
            {onlineVal > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Online ({onlineMethod})</span>
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
                Rs {remaining.toFixed(2)}
              </span>
            </div>
          </div>

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
