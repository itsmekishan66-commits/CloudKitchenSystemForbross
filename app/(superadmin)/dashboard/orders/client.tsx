"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { usePermissions } from "@/lib/permission-context";
import OrdersTable from "../../_components/OrdersTable";
import Checkbox from "@/app/_components/Checkbox";

interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
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
  dueAmount?: string | null;
  landmarkName?: string;
  status: string;
  paymentSettled?: number | boolean | null;
  notes?: string | null;
  createdAt: Date | string;
  items: OrderItem[];
}

interface DeliveryZone {
  id: number;
  landmarkName: string;
  deliveryCharge: string;
}

interface MenuItem {
  id: number;
  title: string;
  price: string;
  discountPercent?: string | null;
  addons?: { name: string; price: number }[];
}

interface FormItem {
  menuItemId: string;
  title: string;
  quantity: string;
  price: string;
  meta?: { addons?: { name: string; price: number }[] };
}

export default function OrdersClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Add order modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Item adder state (inside modal)
  const [addMenuItemId, setAddMenuItemId] = useState("");
  const [addItemName, setAddItemName] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");
  const [addItemPrice, setAddItemPrice] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const [userType, setUserType] = useState<"guest" | "logged">("guest");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookedUpUser, setLookedUpUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
    status: "Pending",
    zoneId: "",
    deliveryCharge: "",
    discountAmount: "",
    notes: "",
    items: [] as FormItem[],
  });

  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => o.customerName.toLowerCase().includes(q) || (o.phone ?? "").toLowerCase().includes(q) || (o.address ?? "").toLowerCase().includes(q) || String(o.id).includes(q));
  }, [orders, search]);

  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const start = (page - 1) * perPage;
  const visibleOrders = filteredOrders.slice(start, start + perPage);

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setOrders(data.orders ?? []);
      }
    } catch {
      setError("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function loadZones() {
    try {
      const res = await fetch("/api/delivery-zones");
      const data = await res.json();
      if (!data.error) setZones(data.zones ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { void loadOrders(); }, 0);
    return () => clearTimeout(t);
  }, []);

  function openAddModal() {
    setForm({
      customerName: "",
      phone: "",
      address: "",
      paymentMethod: "COD",
      status: "Pending",
      zoneId: "",
      deliveryCharge: "",
      discountAmount: "",
      notes: "",
      items: [] as FormItem[],
    });
    setAddMenuItemId("");
    setAddItemName("");
    setAddItemQty("1");
    setAddItemPrice("");
    setSelectedAddons([]);
    setUserType("guest");
    setLookupEmail("");
    setLookedUpUser(null);
    setLookupError("");
    setFormError("");
    setFieldErrors({});
    void loadZones();
    fetch("/api/orders/items")
      .then((res) => res.json())
      .then((data) => { if (!data.error) setMenuItems(data.menuItems ?? []); })
      .catch(() => {});
    setShowAddModal(true);
  }

  function updateItem(index: number, key: keyof FormItem, value: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    }));
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const computedTotal = useMemo(() => {
    const itemsSubtotal = form.items.reduce(
      (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0),
      0,
    );
    const delivery = Number(form.deliveryCharge) || 0;
    const discount = Number(form.discountAmount) || 0;
    return Math.max(0, itemsSubtotal + delivery - discount);
  }, [form]);

  async function handleLookupUser() {
    if (!lookupEmail.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookedUpUser(null);
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(lookupEmail.trim())}&isGuest=false`);
      const data = await res.json();
      if (data.error || !data.users?.length) {
        setLookupError("No user found with this email");
      } else {
        setLookedUpUser(data.users[0]);
      }
    } catch {
      setLookupError("Failed to look up user");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleCreateOrder() {
    setFormError("");
    const next: Record<string, string> = {};
    if (!form.customerName.trim()) next.customerName = "This field is required.";
    if (!form.phone.trim()) next.phone = "This field is required.";
    if (!form.address.trim()) next.address = "This field is required.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    const validItems = form.items.filter(
      (it) => it.title.trim() && (Number(it.quantity) || 0) > 0 && (Number(it.price) || 0) >= 0,
    );
    if (validItems.length === 0) {
      setFieldErrors((prev) => ({ ...prev, items: "At least one item is required." }));
      return;
    }

    if (userType === "logged" && !lookedUpUser) {
      setFormError("Search and confirm a logged user email before creating order");
      return;
    }

    const selectedZone = form.zoneId ? zones.find((z) => z.id.toString() === form.zoneId) : null;
    const deliveryCharge = selectedZone ? Number(selectedZone.deliveryCharge) : Number(form.deliveryCharge) || 0;

    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          paymentMethod: form.paymentMethod,
          status: form.status,
          isGuest: userType === "guest",
          userId: lookedUpUser ? lookedUpUser.id : undefined,
          zoneId: selectedZone ? selectedZone.id : undefined,
          landmarkName: selectedZone ? selectedZone.landmarkName : "",
          deliveryCharge,
          discountAmount: Number(form.discountAmount) || 0,
          notes: form.notes?.trim() || undefined,
          items: validItems.map((it) => ({
            menuItemId: it.menuItemId ? Number(it.menuItemId) : null,
            title: it.title.trim(),
            quantity: Number(it.quantity),
            price: Number(it.price),
            meta: it.meta ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Unable to create order");
        return;
      }
      setShowAddModal(false);
      await loadOrders();
    } catch {
      setFormError("Unable to create order");
    } finally {
      setSaving(false);
    }
  }


  //to make pag reload after certain time interval , so that user can see the changes in real time
  //not a good practice said by senior developer(bijay dulal)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     window.location.reload();
  //   }, 5000); 
  //   console.log("Interval set to reload the page every 5 seconds.");

  //   return () => clearInterval(interval);
  // }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 text-red-600 shadow">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Orders</h1>
        <div className="flex items-center flex-wrap gap-3">
          {can("CREATE_ORDERS") && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600 shrink-0"
            >
              <Plus size={18} /> Add Order
            </button>
          )}
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search orders..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      <OrdersTable orders={visibleOrders} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filteredOrders.length} orders)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-2xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg sm:text-xl font-bold">Add Order</h2>

            {formError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>
            )}

            <div className="space-y-4">
              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => updateForm("customerName", e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                  {fieldErrors.customerName && <p className="mt-1 text-sm text-red-500">{fieldErrors.customerName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                  {fieldErrors.phone && <p className="mt-1 text-sm text-red-500">{fieldErrors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border p-3"
                />
                {fieldErrors.address && <p className="mt-1 text-sm text-red-500">{fieldErrors.address}</p>}
              </div>

              {/* User type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <div className="flex gap-2 items-start">
                  <select
                    value={userType}
                    onChange={(e) => {
                      setUserType(e.target.value as "guest" | "logged");
                      setLookedUpUser(null);
                      setLookupEmail("");
                      setLookupError("");
                    }}
                    className="rounded-lg border p-3 w-36"
                  >
                    <option value="guest">Guest</option>
                    <option value="logged">Logged</option>
                  </select>
                  {userType === "logged" && (
                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        type="email"
                        placeholder="Enter user email"
                        value={lookupEmail}
                        onChange={(e) => { setLookupEmail(e.target.value); setLookedUpUser(null); setLookupError(""); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && lookupEmail.trim()) {
                            (e.target as HTMLInputElement).blur();
                            handleLookupUser();
                          }
                        }}
                        className="flex-1 rounded-lg border p-3"
                      />
                      <button
                        type="button"
                        onClick={handleLookupUser}
                        disabled={lookupLoading || !lookupEmail.trim()}
                        className="rounded-lg bg-orange-500 px-4 py-3 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                      >
                        {lookupLoading ? "..." : "Search"}
                      </button>
                    </div>
                  )}
                </div>
                {lookedUpUser && (
                  <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                    Found: {lookedUpUser.email} ({lookedUpUser.name})
                  </div>
                )}
                {lookupError && (
                  <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {lookupError}
                  </div>
                )}
              </div>

              {/* Order meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-3"
                  >
                    <option value="COD">COD</option>
                    <option value="ONLINE">ONLINE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-3"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ladmark Area</label>
                  <select
                    value={form.zoneId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        zoneId: e.target.value,
                        deliveryCharge: e.target.value
                          ? (zones.find((z) => z.id.toString() === e.target.value)?.deliveryCharge ?? "")
                          : form.deliveryCharge,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-3"
                  >
                    <option value="">Choose area</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.landmarkName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Charge (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.deliveryCharge}
                    disabled={!!form.zoneId}
                    onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-3 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Note (optional)</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* Items */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Order Items</label>

                {/* Add item row */}
                <div className="grid grid-cols-12 gap-2 items-end mb-3">
                  <div className="col-span-5 sm:col-span-5">
                    <label className="block text-xs text-gray-500 mb-1">Menu Item</label>
                    <select
                      value={addMenuItemId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setAddMenuItemId(id);
                        setSelectedAddons([]);
                        if (id) {
                          const item = menuItems.find((m) => m.id.toString() === id);
                          if (item) {
                            setAddItemName(item.title);
                            const dp = item.discountPercent ? Number(item.discountPercent) : 0;
                            const base = Number(item.price);
                            const display = dp > 0 ? base - (base * dp) / 100 : base;
                            setAddItemPrice(display.toFixed(2));
                          }
                        } else {
                          setAddItemName("");
                          setAddItemPrice("");
                        }
                      }}
                      className="w-full rounded-lg border p-2.5 text-sm"
                    >
                      <option value="">Custom</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} — Rs.{(() => { const dp = m.discountPercent ? Number(m.discountPercent) : 0; const base = Number(m.price); const display = dp > 0 ? base - (base * dp) / 100 : base; return display.toFixed(0); })()}{m.discountPercent ? ` (-${m.discountPercent}%)` : ""}{m.addons && m.addons.length > 0 ? ` [${m.addons.length} addon${m.addons.length > 1 ? "s" : ""}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={addItemQty}
                      onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value)).toString())}
                      className="w-full rounded-lg border p-2.5 text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={addItemPrice}
                      onChange={(e) => setAddItemPrice(e.target.value)}
                      className="w-full rounded-lg border p-2.5 text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!addItemName.trim() || !addItemPrice || Number(addItemPrice) < 0 || Number(addItemQty) < 1) return;
                        const addonMeta = selectedAddons.length > 0 ? { addons: selectedAddons } : undefined;
                        setForm((prev) => ({
                          ...prev,
                          items: [
                            ...prev.items,
                            {
                              menuItemId: addMenuItemId,
                              title: addItemName.trim(),
                              quantity: addItemQty,
                              price: addItemPrice,
                              meta: addonMeta,
                            },
                          ],
                        }));
                        setAddMenuItemId("");
                        setAddItemName("");
                        setAddItemQty("1");
                        setAddItemPrice("");
                        setSelectedAddons([]);
                      }}
                      className="w-full rounded-lg bg-orange-500 px-2 py-2.5 text-white text-sm font-semibold hover:bg-orange-600"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Discount badge */}
                {addMenuItemId && (() => {
                  const item = menuItems.find((m) => m.id.toString() === addMenuItemId);
                  if (!item?.discountPercent) return null;
                  const dp = Number(item.discountPercent);
                  const base = Number(item.price);
                  const discounted = base - (base * dp) / 100;
                  return (
                    <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                      <span className="line-through text-gray-400">Rs.{base.toFixed(2)}</span>
                      <span className="ml-2 font-semibold text-green-600">-{dp}%</span>
                      <span className="ml-2">= Rs.{discounted.toFixed(2)}</span>
                    </div>
                  );
                })()}

                {/* Addon selection */}
                {addMenuItemId && (() => {
                  const item = menuItems.find((m) => m.id.toString() === addMenuItemId);
                  if (!item?.addons?.length) return null;
                  const dp = item.discountPercent ? Number(item.discountPercent) : 0;
                  const basePrice = Number(item.price);
                  const discountedBase = dp > 0 ? basePrice - (basePrice * dp) / 100 : basePrice;
                  const addonTotal = selectedAddons.reduce((s, a) => s + Number(a.price), 0);
                  return (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons / Extras</label>
                      <div className="space-y-2">
                        {item.addons.map((addon, i) => (
                          <label key={i} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={selectedAddons.some((a) => a.name === addon.name)}
                              onChange={(e) => {
                                const extra = Number(addon.price);
                                if (e.target.checked) {
                                  setSelectedAddons((prev) => [...prev, addon]);
                                  setAddItemPrice(((discountedBase + addonTotal + extra) || 0).toFixed(2));
                                } else {
                                  setSelectedAddons((prev) => prev.filter((a) => a.name !== addon.name));
                                  setAddItemPrice(((discountedBase + addonTotal - extra) || 0).toFixed(2));
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700 flex-1">{addon.name}</span>
                            <span className="text-sm text-gray-500">+Rs.{Number(addon.price).toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Items list */}
                {form.items.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No items added yet</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left font-medium text-gray-600">Item</th>
                          <th className="p-2 text-right font-medium text-gray-600">Qty</th>
                          <th className="p-2 text-right font-medium text-gray-600">Price</th>
                          <th className="p-2 text-right font-medium text-gray-600">Subtotal</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((it, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              <span>{it.title}</span>
                              {it.meta?.addons && it.meta.addons.length > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                  {it.meta.addons.map((a, i) => (
                                    <div key={i} className="flex gap-1">
                                      <span className="text-orange-400">+</span>
                                      <span>{a.name}</span>
                                      <span className="text-gray-500">(Rs.{Number(a.price).toFixed(2)})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                className="w-16 rounded border p-1 text-right text-sm"
                              />
                            </td>
                            <td className="p-2 text-right">Rs.{Number(it.price).toFixed(2)}</td>
                            <td className="p-2 text-right font-medium">Rs.{(Number(it.price) * Number(it.quantity)).toFixed(2)}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    items: prev.items.filter((_, i) => i !== index),
                                  }));
                                }}
                                className="text-red-400 text-lg"
                                aria-label="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {fieldErrors.items && (
                <p className="mt-2 text-sm text-red-500">{fieldErrors.items}</p>
              )}

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">Rs.{computedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={saving}
                className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
