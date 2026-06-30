"use client";
import { CircleArrowDown, Package, Truck, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minStockLevel: string;
  pricePerUnit: string;
  kitchenId: number | null;
}

interface InventoryForm {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minStockLevel: string;
  pricePerUnit: string;
  kitchenId: number | null;
}

const emptyForm: InventoryForm = { name: "", category: "Other", quantity: "0", unit: "pcs", minStockLevel: "0", pricePerUnit: "0", kitchenId: null };

export default function InventoryClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "supplier-stock" | "inventory-stock">("inventory");
  const [supplierStock, setSupplierStock] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  //to download the file
   const handleDownload = (type: string) => {
    if (type) {
      window.open(`/api/exports/${type}?source=inventory`, "_blank");
    }
  };


  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, search]);

  async function loadItems() {
    try {
      const res = await fetch("/api/superadmin/inventory");
      const data = await res.json();
      if (!data.error) setItems(data.items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplierStock() {
    setStockLoading(true);
    try {
      const res = await fetch("/api/superadmin/suppliers/stock");
      const data = await res.json();
      if (!data.error) setSupplierStock(data.items ?? []);
    } catch {
      console.error("Failed to load supplier stock");
    } finally {
      setStockLoading(false);
    }
  }

  useEffect(() => { 
    async function fetchItems() {
      await loadItems();
    }
    void fetchItems();
  }, []);

  useEffect(() => {
    // Avoid synchronous setState during render/effect by deferring calls
    if (activeTab === "supplier-stock") {
      const t = setTimeout(() => { void loadSupplierStock(); }, 0);
      return () => clearTimeout(t);
    }
    if (activeTab === "inventory-stock") {
      const t = setTimeout(() => { void loadItems(); }, 0);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minStockLevel: item.minStockLevel,
      pricePerUnit: item.pricePerUnit,
      kitchenId: item.kitchenId,
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  async function handleSave() {
    if (!form.name) {
      setMessage("Name is required");
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      if (editing) {
        const res = await fetch("/api/superadmin/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      } else {
        const res = await fetch("/api/superadmin/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      }

      setShowModal(false);
      await loadItems();
    } catch {
      setMessage("Failed to save inventory item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/superadmin/inventory?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      await loadItems();
    } catch {
      setMessage("Failed to delete inventory item");
    }
  }

  const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.minStockLevel));

  if (loading) {
    return <div className="rounded-xl bg-white p-6 text-gray-600 shadow">Loading inventory...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center justify-end gap-4">
          {can("DOWNLOAD_INVENTORY") && (
          <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
          )}
          {can("CREATE_INVENTORY") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">+ Add Item</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("inventory")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "inventory" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Package size={16} /> Inventory Items
        </button>
        <button onClick={() => setActiveTab("supplier-stock")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "supplier-stock" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Truck size={16} /> Supplier Stock
        </button>
        <button onClick={() => setActiveTab("inventory-stock")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "inventory-stock" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Package size={16} /> Inventory Stock
        </button>
      </div>

      {activeTab === "inventory" && lowStockItems.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 border border-red-200">
          <h3 className="font-bold text-red-700">Low Stock Alert ({lowStockItems.length} items)</h3>
          <ul className="mt-2 space-y-1">
            {lowStockItems.map((item) => (
              <li key={item.id} className="text-sm text-red-600">{item.name} - {item.quantity} {item.unit} left (min: {item.minStockLevel})</li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      {activeTab === "inventory" && (
      <>
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="rounded-xl bg-white shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Quantity</th>
                <th className="p-4 text-left">Min Stock</th>
                <th className="p-4 text-left">Price/Unit</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No inventory items found</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.minStockLevel);
                  return (
                    <tr key={item.id} className={`border-t ${isLow ? "bg-red-50" : ""}`}>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-gray-500">{item.category}</td>
                      <td className={`p-4 ${isLow ? "text-red-600 font-semibold" : ""}`}>{item.quantity} {item.unit}</td>
                      <td className="p-4 text-gray-500">{item.minStockLevel} {item.unit}</td>
                      <td className="p-4">Rs.{item.pricePerUnit}</td>
                      <td className="p-4">
                        {can("UPDATE_INVENTORY") && <button onClick={() => openEdit(item)} className="mr-2 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">Edit</button>}
                        {can("DELETE_INVENTORY") && <button onClick={() => handleDelete(item.id)} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">Delete</button>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </>
      )}

      {activeTab === "supplier-stock" && (
        <SupplierStockView data={supplierStock} loading={stockLoading} />
      )}

      {activeTab === "inventory-stock" && (
        <InventoryStockView items={items} loading={loading} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                  <input type="number" step="0.01" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price Per Unit</label>
                  <input type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierStockView({ data, loading }: { data: any[]; loading: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((i) =>
      i.productName?.toLowerCase().includes(q) ||
      i.supplierName?.toLowerCase().includes(q) ||
      i.purchaseUnit?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const lowStockItems = filtered.filter((i) => Number(i.quantity) <= Number(i.minStockLevel));

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-gray-400 shadow">Loading supplier stock...</div>;
  }

  return (
    <div>
      {lowStockItems.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 border border-red-200">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} /> Low Stock Alert ({lowStockItems.length} items)
          </h3>
          <ul className="mt-2 space-y-1">
            {lowStockItems.map((item) => (
              <li key={item.productId} className="text-sm text-red-600">
                {item.supplierName} — {item.productName}: {item.quantity} {item.purchaseUnit || "packs"} left
                (min: {item.minStockLevel})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, supplier, or unit..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Supplier</th>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Pack</th>
              <th className="p-4 text-left">Stock (packs)</th>
              <th className="p-4 text-left">Total Units</th>
              <th className="p-4 text-left">Min Stock</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No supplier stock found</td></tr>
            ) : (
              filtered.map((item) => {
                const qty = Number(item.quantity);
                const min = Number(item.minStockLevel);
                const unitsPerPack = Number(item.unitsPerPack) || 1;
                const isLow = qty <= min;
                return (
                  <tr key={item.productId} className={`border-t ${isLow ? "bg-red-50" : ""}`}>
                    <td className="p-4 font-medium">{item.supplierName}</td>
                    <td className="p-4">{item.productName}</td>
                    <td className="p-4 text-sm text-gray-500">{item.purchaseUnit || "Carton"} × {unitsPerPack}</td>
                    <td className={`p-4 ${isLow ? "text-red-600 font-semibold" : ""}`}>{qty}</td>
                    <td className="p-4 text-gray-500">{qty * unitsPerPack}</td>
                    <td className="p-4 text-gray-500">{min}</td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <AlertTriangle size={12} /> Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t bg-gray-50">
          Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""} from suppliers
        </div>
      </div>
    </div>
  );
}

function InventoryStockView({ items, loading }: { items: InventoryItem[]; loading: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  const lowStockItems = filtered.filter((i) => Number(i.quantity) <= Number(i.minStockLevel));

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-gray-400 shadow">Loading inventory stock...</div>;
  }

  return (
    <div>
      {lowStockItems.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 border border-red-200">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} /> Low Stock Alert ({lowStockItems.length} items)
          </h3>
          <ul className="mt-2 space-y-1">
            {lowStockItems.map((item) => (
              <li key={item.id} className="text-sm text-red-600">
                {item.name} — {item.quantity} {item.unit} left (min: {item.minStockLevel})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Unit</th>
              <th className="p-4 text-left">Min Stock</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No inventory stock found</td></tr>
            ) : (
              filtered.map((item) => {
                const isLow = Number(item.quantity) <= Number(item.minStockLevel);
                return (
                  <tr key={item.id} className={`border-t ${isLow ? "bg-red-50" : ""}`}>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-gray-500">{item.category}</td>
                    <td className={`p-4 ${isLow ? "text-red-600 font-semibold" : ""}`}>{item.quantity}</td>
                    <td className="p-4 text-gray-500">{item.unit}</td>
                    <td className="p-4 text-gray-500">{item.minStockLevel}</td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <AlertTriangle size={12} /> Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t bg-gray-50">
          Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}