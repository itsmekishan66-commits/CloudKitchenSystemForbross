"use client";

import { useEffect, useRef, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  meta?: {
    image?: string;
    clientId?: string;
    addons?: { name: string; price: number }[];
    originalPrice?: number;
    discountPercent?: number;
  };
}

interface Order {
  id: number;
  userId: number | null;
  customerName: string;
  phone: string;
  address: string;
  userEmail: string | null;
  isGuest: boolean;
  paymentMethod: string;
  total: string;
  deliveryCharge: string;
  discountAmount?: string | null;
  dueAmount?: string | null;
  landmarkName?: string;
  status: string;
  paymentSettled?: number | boolean | null;
  previousDues?: number;
  userCreditBalance?: number;
  createdAt: Date | string;
  items: OrderItem[];
}

interface MenuItem {
  id: number;
  title: string;
  price: string;
  image: string | null;
  addons?: { name: string; price: number }[];
  discountPercent?: string | null;
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [localOrders, setLocalOrders] = useState(orders);
  const [addItemOrder, setAddItemOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ itemId: number; orderId: number; title: string } | null>(null);
  const [settleOrder, setSettleOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLocalOrders(orders), 0);
    return () => clearTimeout(t);
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-100 text-green-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      case "Preparing": return "bg-blue-100 text-blue-700";
      case "Out For Delivery": return "bg-purple-100 text-purple-700";
      case "Pending":
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  async function updateStatus(id: number, status: string) {
    setMessage("");
    const prevOrder = localOrders.find((o) => o.id === id);
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      setMessage("Unable to update order status.");
      setMessageType("error");
      return;
    }
    setLocalOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
    if (status === "Delivered" && prevOrder) {
      setSettleOrder({ ...prevOrder, status: "Delivered" });
    } else {
      setMessage("Order status updated.");
      setMessageType("success");
    }
  }

  async function updateItemQty(itemId: number, action: "increase" | "decrease") {
    const res = await fetch("/api/orders/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, action }),
    });
    const data = await res.json();
    if (data.error) { setMessage(data.error); setMessageType("error"); return; }
    setLocalOrders((prev) =>
      prev.map((o) => ({
        ...o,
        total: data.total,
        items: o.items.map((i) => (i.id === itemId ? { ...i, quantity: data.quantity } : i)),
      }))
    );
  }

  async function deleteItem(itemId: number, orderId: number) {
    const res = await fetch(`/api/orders/items?itemId=${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) { setMessage(data.error); setMessageType("error"); return; }
    if (data.empty) {
      setLocalOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, total: "0.00", status: "Cancelled", items: [] } : o))
      );
    } else {
      setLocalOrders((prev) =>
        prev.map((o) => ({
          ...o,
          total: data.total,
          items: o.items.filter((i) => i.id !== itemId),
        }))
      );
    }
  }

  async function openAddItem(order: Order) {
    setAddItemOrder(order);
    setSelectedMenuItem("");
    setAddQty(1);
    setSelectedAddons([]);
    setAdding(false);
    try {
      const res = await fetch("/api/orders/items");
      const data = await res.json();
      setMenuItems(data.menuItems ?? []);
    } catch {
      setMessage("Failed to load menu items");
      setMessageType("error");
    }
  }

  async function handleAddItem() {
    if (!addItemOrder || !selectedMenuItem) return;
    const item = menuItems.find((m) => m.id.toString() === selectedMenuItem);
    if (!item) return;
    setAdding(true);

    const basePrice = Number(item.price);
    const discountPct = item.discountPercent ? Number(item.discountPercent) : 0;
    const discountedBase = discountPct > 0 ? basePrice - (basePrice * discountPct) / 100 : basePrice;
    const addonTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
    const finalPrice = discountedBase + addonTotal;

    const meta: Record<string, unknown> = {};
    if (selectedAddons.length > 0) meta.addons = selectedAddons;
    if (discountPct > 0) {
      meta.originalPrice = basePrice + addonTotal;
      meta.discountPercent = discountPct;
    }

    const res = await fetch("/api/orders/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: addItemOrder.id,
        menuItemId: item.id,
        title: item.title,
        price: finalPrice,
        quantity: addQty,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
        discountPercent: discountPct > 0 ? discountPct : undefined,
      }),
    });
    const data = await res.json();
    if (data.error) { setMessage(data.error); setMessageType("error"); setAdding(false); return; }
    setAddItemOrder(null);
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === addItemOrder.id ? { ...o, total: data.total } : o))
    );
    setMessage("Item added to order");
    setMessageType("success");
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-gray-600 shadow">
        No orders found.
      </div>
    );
  }

  return (
    <>
      {message ? (
        <p className={`mb-4 rounded-xl p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </p>
      ) : null}

      <div className="space-y-4">
        {localOrders.map((order) => (
          <div
            key={order.id}
            className={`rounded-xl shadow overflow-hidden border-l-4 ${!order.isGuest && order.userId
              ? "border-l-green-500 bg-green-200"
              : "border-l-gray-300 bg-white"
              }`}
          >
            <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-gray-100">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-medium text-gray-900">#{order.id}</span>
                <span className="text-gray-700">{order.customerName}</span>
                {!order.isGuest && order.userId && Number(order.userCreditBalance || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Credit: Rs {Number(order.userCreditBalance).toFixed(0)}
                  </span>
                )}
                {order.isGuest || !order.userId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">Guest</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Logged</span>
                )}
                {!order.isGuest && order.userId && Number(order.userCreditBalance || 0) > 0 ? (
                  <span className="text-gray-500">
                    Rs.{(Number(order.total) - Number(order.userCreditBalance)).toFixed(2)}
                    <span className="text-xs text-emerald-600 ml-1">
                      (Rs.{order.total} - Rs.{Number(order.userCreditBalance).toFixed(2)} credit)
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">Rs.{order.total}</span>
                )}
                {Number(order.deliveryCharge) > 0 && (
                  <span className="text-xs text-gray-400">(incl. Rs.{Number(order.deliveryCharge).toFixed(2)} delivery)</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
                {can("UPDATE_ORDERS") ? (
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                )}
                {order.status === "Delivered" && (
                  Number(order.dueAmount ?? 0) > 0 ? (
                    <button
                      onClick={() => router.push(`/dashboard/payment/settle/${order.id}`)}
                      className="text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      Due Rs {Number(order.dueAmount ?? 0).toFixed(2)}
                    </button>
                  ) : order.paymentSettled ? (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      Settled
                    </span>
                  ) : (
                    <button
                      onClick={() => router.push(`/dashboard/payment/settle/${order.id}`)}
                      className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Not Settled
                    </button>
                  )
                )}
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Details</h4>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-400">Name:</span> {order.customerName}</p>
                  <p><span className="text-gray-400">Phone:</span> {order.phone}</p>
                  <p><span className="text-gray-400">Address:</span> {order.address}</p>
                  {order.landmarkName && <p><span className="text-gray-400">Landmark:</span> {order.landmarkName}</p>}
                  {order.userEmail && <p><span className="text-gray-400">Email:</span> {order.userEmail}</p>}
                  <p><span className="text-gray-400">Payment:</span> {order.paymentMethod}</p>
                  {!order.isGuest && order.userId && Number(order.userCreditBalance || 0) > 0 && (
                    <p><span className="text-gray-400">Credit:</span> Rs {Number(order.userCreditBalance).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Items</h4>
                  {order.status !== "Delivered" && order.status !== "Cancelled" && can("UPDATE_ORDERS") && (
                    <button
                      onClick={() => openAddItem(order)}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      + Add Item
                    </button>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1.5 text-left font-bold text-red-500">Item</th>
                      <th className="py-1.5 text-right font-medium text-green-500">Qty</th>
                      <th className="py-1.5 text-right font-medium text-blue-500">Price</th>
                      <th className="py-1.5 text-right font-medium text-black">Subtotal</th>
                      {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && (
                        <th className="py-1.5 text-right"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.length === 0 ? (
                      <tr><td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 5 : 4} className="py-4 text-center text-gray-400">No items</td></tr>
                    ) : (
                      order.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{item.title}</span>
                              {item.meta?.discountPercent ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                  -{item.meta.discountPercent}%
                                </span>
                              ) : null}
                            </div>
                            {item.meta?.discountPercent && item.meta?.originalPrice ? (
                              <span className="text-xs text-gray-400 line-through">Rs.{Number(item.meta.originalPrice).toFixed(2)}</span>
                            ) : null}
                            {item.meta?.addons && item.meta.addons.length > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                {item.meta.addons.map((a, i) => (
                                  <div key={i} className="flex gap-1">
                                    <span className="text-orange-400">+</span>
                                    <span>{a.name}</span>
                                    <span className="text-gray-500">(Rs.{Number(a.price).toFixed(2)})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 text-right">
                            {order.status !== "Delivered" && order.status !== "Cancelled" && can("UPDATE_ORDERS") ? (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => updateItemQty(item.id, "decrease")}
                                  className="w-5 h-5 rounded border border-gray-300 text-xs leading-none hover:bg-gray-100"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQty(item.id, "increase")}
                                  className="w-5 h-5 rounded border border-gray-300 text-xs leading-none hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </span>
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="py-1.5 text-right">Rs.{item.price}</td>
                          <td className="py-1.5 text-right font-medium">
                            Rs.{(Number(item.price) * item.quantity).toFixed(2)}
                          </td>
                          {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && (
                            <td className="py-1.5 text-right">
                              <button
                                onClick={() => setConfirmDelete({ itemId: item.id, orderId: order.id, title: item.title })}
                                className="text-red-400 hover:text-red-600 text-xs"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const itemsSubtotal = order.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
                      return (
                        <>
                          <tr>
                            <td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 4 : 3} className="py-1 text-right text-gray-500 text-xs">Items Subtotal</td>
                            <td className="py-1 text-right text-gray-500 text-xs">Rs.{itemsSubtotal.toFixed(2)}</td>
                            {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && <td></td>}
                          </tr>
                          <tr>
                            <td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 4 : 3} className="py-1 text-right text-gray-500 text-xs">Delivery Charge</td>
                            <td className="py-1 text-right text-gray-500 text-xs">Rs.{Number(order.deliveryCharge).toFixed(2)}</td>
                            {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && <td></td>}
                          </tr>
                          {Number(order.discountAmount || 0) > 0 && (
                            <tr>
                              <td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 4 : 3} className="py-1 text-right text-green-600 text-xs">Coupon Discount</td>
                              <td className="py-1 text-right text-green-600 text-xs">- Rs.{Number(order.discountAmount).toFixed(2)}</td>
                              {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && <td></td>}
                            </tr>
                          )}

                          {/* Previous dues to be added in superadmin orders above the total */}
                          {Number(order.previousDues || 0) > 0 && (
                            <tr>
                              <td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 4 : 3} className="py-1 text-right text-amber-600 text-xs">Previous Dues</td>
                              <td className="py-1 text-right text-amber-600 text-xs font-semibold">Rs.{Number(order.previousDues).toFixed(2)}</td>
                              {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && <td></td>}
                            </tr>
                          )}

                          <tr>
                            <td colSpan={order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") ? 4 : 3} className="py-1.5 text-right font-semibold text-gray-700">Total</td>
                            <td className="py-1.5 text-right font-bold">Rs.{(Number(order.total) + Number(order.previousDues || 0)).toFixed(2)}</td>
                            {order.status !== "Delivered" && order.status !== "Cancelled" && can("DELETE_ORDERS") && <td></td>}
                          </tr>
                        </>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-2">Remove Item</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove <strong>{confirmDelete.title}</strong> from this order?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteItem(confirmDelete.itemId, confirmDelete.orderId);
                  setConfirmDelete(null);
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Popup */}
      {settleOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✓</div>
              <div>
                <h2 className="text-lg font-bold">Order Delivered!</h2>
                <p className="text-sm text-gray-500">Order #{settleOrder.id} — Rs.{settleOrder.total}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Settle the payment for this delivery now?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={async () => {
                  setSettleOrder(null);
                  setMessage("Creating due...");
                  try {
                    await fetch("/api/payments/settle", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        orderId: settleOrder.id,
                        cashAmount: 0,
                        onlineAmount: 0,
                        discount: 0,
                        markAsDue: true,
                        dueAmount: Number(settleOrder.total),
                        duePersonName: settleOrder.customerName,
                        dueRole: "customer",
                      }),
                    });
                    setMessage("Due created for Order #" + settleOrder.id + ". Settle from Payment page.");
                    setMessageType("success");
                  } catch {
                    setMessage("Failed to create due.");
                    setMessageType("error");
                  }
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Later (Mark as Due)
              </button>
              <button
                onClick={() => {
                  router.push(`/dashboard/payment/settle/${settleOrder.id}`);
                }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 flex items-center gap-2"
              >
                Settle Now
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add Item to Order #{addItemOrder.id}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item</label>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search items..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-2 outline-none focus:border-orange-400"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();

                    // const filtered = menuItems.filter((m) =>
                    menuItems.filter((m) =>
                      m.title.toLowerCase().includes(q)
                    );
                  }}
                />
                <select
                  value={selectedMenuItem}
                  onChange={(e) => {
                    setSelectedMenuItem(e.target.value);
                    setSelectedAddons([]);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                >
                  <option value="">-- Select item --</option>
                  {menuItems.map((m) => {
                    const dp = m.discountPercent ? Number(m.discountPercent) : 0;
                    const base = Number(m.price);
                    const display = dp > 0 ? base - (base * dp) / 100 : base;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.title} — Rs.{display.toFixed(0)}{dp > 0 ? ` (-${dp}%)` : ""}{m.addons && m.addons.length > 0 ? ` [${m.addons.length} addon${m.addons.length > 1 ? "s" : ""}]` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedMenuItem && (() => {
                const item = menuItems.find((m) => m.id.toString() === selectedMenuItem);
                if (!item) return null;
                const basePrice = Number(item.price);
                const discountPct = item.discountPercent ? Number(item.discountPercent) : 0;
                const discountedBase = discountPct > 0 ? basePrice - (basePrice * discountPct) / 100 : basePrice;
                const addonTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
                const finalPrice = (discountedBase + addonTotal) * addQty;

                return (
                  <>
                    {discountPct > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                        <span className="line-through text-gray-400">Rs.{basePrice.toFixed(2)}</span>
                        <span className="ml-2 font-semibold text-green-600">-{discountPct}%</span>
                        <span className="ml-2">= Rs.{discountedBase.toFixed(2)}</span>
                      </div>
                    )}

                    {item.addons && item.addons.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons / Extras</label>
                        <div className="space-y-2">
                          {item.addons.map((addon, i) => (
                            <label key={i} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAddons.some((a) => a.name === addon.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAddons((prev) => [...prev, addon]);
                                  } else {
                                    setSelectedAddons((prev) => prev.filter((a) => a.name !== addon.name));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                              />
                              <span className="text-sm text-gray-700 flex-1">{addon.name}</span>
                              <span className="text-sm text-gray-500">+Rs.{Number(addon.price).toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Unit Price</span>
                        <span>Rs.{discountedBase.toFixed(2)}{addonTotal > 0 ? ` + ${addonTotal.toFixed(2)} addons` : ""}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Quantity</span>
                        <span>× {addQty}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-1">
                        <span>Total</span>
                        <span>Rs.{finalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAddItemOrder(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={adding || !selectedMenuItem}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
