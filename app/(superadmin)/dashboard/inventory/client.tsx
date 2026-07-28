"use client";
import { CircleArrowDown, Package, Truck, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import toast from "react-hot-toast";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minStockLevel: string;
  pricePerUnit: string;
  kitchenId: number | null;
  conversionUnit: string | null;
  conversionValue: string | null;
}

interface SupplierStockItem {
  productId: number;
  productName: string;
  supplierName: string;
  purchaseUnit: string | null;
  quantity: string;
  minStockLevel: string;
  unitsPerPack: string;
}

interface CookedStockItem {
  id: number;
  foodName: string;
  menuItemId: number;
  quantity: string;
  minStockLevel: string;
  description: string | null;
  createdAt?: string;
}

const smallUnitOptions = [
  "Piece", "Gram", "Kg", "ml", "Litre", "Pack", "Box", "Carton",
  "Bottle", "Tin", "Jar", "Bucket", "Crate", "Dozen",
] as const;

interface InventoryForm {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minStockLevel: string;
  pricePerUnit: string;
  kitchenId: number | null;
  conversionUnit: string;
  conversionValue: string;
}

const emptyForm: InventoryForm = { name: "", category: "", quantity: "", unit: "", minStockLevel: "", pricePerUnit: "", kitchenId: null, conversionUnit: "", conversionValue: "" };

export default function InventoryClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"inventory" | "supplier-stock" | "inventory-stock" | "cooked-stock">("inventory");
  const [page, setPage] = useState(1);
  const perPage = 20;

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }
  const [supplierStock, setSupplierStock] = useState<SupplierStockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [cookedStock, setCookedStock] = useState<CookedStockItem[]>([]);
  const [cookedLoading, setCookedLoading] = useState(false);

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

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const start = (page - 1) * perPage;
  const visibleItems = filteredItems.slice(start, start + perPage);

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
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  async function loadCookedStock() {
    setCookedLoading(true);
    try {
      const res = await fetch("/api/superadmin/cooked-items");
      const data = await res.json();
      if (!data.error) setCookedStock(data.items ?? []);
    } catch {
      console.error("Failed to load cooked stock");
    } finally {
      setCookedLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "supplier-stock") {
      const t = setTimeout(() => { void loadSupplierStock(); }, 0);
      return () => clearTimeout(t);
    }
    if (activeTab === "inventory-stock") {
      const t = setTimeout(() => { void loadItems(); }, 0);
      return () => clearTimeout(t);
    }
    if (activeTab === "cooked-stock") {
      const t = setTimeout(() => { void loadCookedStock(); }, 0);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setMessage("");
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
      conversionUnit: item.conversionUnit ?? "",
      conversionValue: item.conversionValue ?? "",
    });
    setErrors({});
    setMessage("");
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
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.category.trim()) newErrors.category = "Category is required.";
    if (!form.quantity.toString().trim()) newErrors.quantity = "Quantity is required.";
    if (!form.unit.trim()) newErrors.unit = "Unit is required.";
    if (!form.minStockLevel.toString().trim()) newErrors.minStockLevel = "Min stock level is required.";
    if (!form.pricePerUnit.toString().trim()) newErrors.pricePerUnit = "Price per unit is required.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (editing) {
      const noChange =
        form.name === editing.name &&
        form.category === editing.category &&
        form.quantity === editing.quantity &&
        form.unit === editing.unit &&
        form.minStockLevel === editing.minStockLevel &&
        form.pricePerUnit === editing.pricePerUnit &&
        form.kitchenId === editing.kitchenId;
      if (noChange) {
        setMessage("Nothing to update.");
        return;
      }
    }

    setErrors({});
    setMessage("");
    setSaving(true);

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
    if (!await confirm("Are you sure you want to delete this item?")) return;
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Inventory</h1>
        <div className="flex items-center flex-wrap gap-3">
          {can("DOWNLOAD_INVENTORY") && (
          <button className=" flex gap-2 rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
          )}
          {can("CREATE_INVENTORY") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600">+ Add Item</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveTab("inventory")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "inventory" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Package size={16} /> Inventory Items
        </button>
        <button onClick={() => setActiveTab("supplier-stock")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "supplier-stock" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Truck size={16} /> Supplier Stock
        </button>
        <button onClick={() => setActiveTab("inventory-stock")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "inventory-stock" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Package size={16} /> Inventory Stock
        </button>
        <button onClick={() => setActiveTab("cooked-stock")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "cooked-stock" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
          <Package size={16} /> Cooked Food Stock
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search inventory..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
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
              {visibleItems.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No inventory items found</td></tr>
              ) : (
                visibleItems.map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.minStockLevel);
                  const displayUnit = item.conversionUnit || item.unit;
                  return (
                    <tr key={item.id} className={`border-t ${isLow ? "bg-red-50" : ""}`}>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-gray-500">{item.category}</td>
                      <td className={`p-4 ${isLow ? "text-red-600 font-semibold" : ""}`}>{item.quantity} {displayUnit}</td>
                      <td className="p-4 text-gray-500">{item.minStockLevel} {displayUnit}</td>
                      <td className="p-4">Rs.{item.pricePerUnit}</td>
                      <td className="flex p-4 gap-4">
                        {can("UPDATE_INVENTORY") && <button onClick={() => openEdit(item)} className="rounded text-blue-500 text-sm"><Edit size={22} /></button>}
                        {can("DELETE_INVENTORY") && <button onClick={() => handleDelete(item.id)} className="rounded text-red-500 text-sm"><Trash2 size={22} /></button>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({filteredItems.length} items)
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
      </>
      )}

      {activeTab === "supplier-stock" && (
        <SupplierStockView data={supplierStock} loading={stockLoading} />
      )}

      {activeTab === "inventory-stock" && (
        <InventoryStockView items={items} loading={loading} />
      )}

      {activeTab === "cooked-stock" && (
        <CookedFoodStockView items={cookedStock} loading={cookedLoading} onRefresh={loadCookedStock} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} noValidate className="space-y-4">
              {message && message !== "Nothing to update." && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} className="mt-1 w-full rounded-lg border p-3">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={(e) => updateForm("quantity", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => updateForm("unit", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit}</p>}
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                <p className="text-sm font-semibold text-purple-700 mb-1">Conversion Unit <span className="text-xs font-normal text-purple-500">(optional)</span></p>
                <p className="text-xs text-purple-500 mb-3">Track in a smaller unit for precise stock deduction.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Smallest Unit</label>
                    <select value={form.conversionUnit} onChange={(e) => updateForm("conversionUnit", e.target.value)} className="mt-1 w-full rounded-lg border p-3">
                      <option value="">-- None --</option>
                      {smallUnitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value per 1 {form.unit || "Unit"}</label>
                    <input type="number" step="0.01" min="0" value={form.conversionValue} onChange={(e) => updateForm("conversionValue", e.target.value)} placeholder="e.g. 1000" className="mt-1 w-full rounded-lg border p-3" />
                  </div>
                </div>
                {form.conversionUnit && form.conversionValue && (
                  <p className="text-xs text-purple-600 mt-2">1 {form.unit || "Unit"} = {form.conversionValue} {form.conversionUnit}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                  <input type="number" step="0.01" value={form.minStockLevel} onChange={(e) => updateForm("minStockLevel", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  {errors.minStockLevel && <p className="mt-1 text-sm text-red-500">{errors.minStockLevel}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price Per Unit</label>
                  <input type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => updateForm("pricePerUnit", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  {errors.pricePerUnit && <p className="mt-1 text-sm text-red-500">{errors.pricePerUnit}</p>}
                </div>
              </div>
            </form>
            {message && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-600">{message}</div>}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
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

function SupplierStockView({ data, loading }: { data: SupplierStockItem[]; loading: boolean }) {
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

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
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

function CookedFoodStockView({ items, loading, onRefresh }: { items: CookedStockItem[]; loading: boolean; onRefresh: () => void }) {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [editingCooked, setEditingCooked] = useState<CookedStockItem | null>(null);
  const [showCookedModal, setShowCookedModal] = useState(false);
  const [cookedForm, setCookedForm] = useState({ menuItemId: "", quantity: "", minStockLevel: "", description: "" });
  const [savingCooked, setSavingCooked] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      (i.foodName ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const lowStockItems = filtered.filter((i) => Number(i.quantity) <= Number(i.minStockLevel));

  function openEditCooked(item: CookedStockItem) {
    setEditingCooked(item);
    setCookedForm({
      menuItemId: String(item.menuItemId),
      quantity: item.quantity,
      minStockLevel: item.minStockLevel ?? "0",
      description: item.description ?? "",
    });
    setShowCookedModal(true);
  }

  async function handleCookedUpdate() {
    if (!editingCooked) return;
    if (cookedForm.quantity === "") { toast.error("Please enter quantity"); return; }
    setSavingCooked(true);
    try {
      const res = await fetch("/api/superadmin/cooked-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCooked.id,
          quantity: cookedForm.quantity,
          minStockLevel: cookedForm.minStockLevel || "0",
          description: cookedForm.description || null,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Cooked food stock updated!");
      setShowCookedModal(false);
      setEditingCooked(null);
      onRefresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingCooked(false);
    }
  }

  async function handleDeleteCooked(id: number) {
    if (!await confirm("Are you sure you want to delete this cooked food stock item?")) return;
    try {
      const res = await fetch(`/api/superadmin/cooked-items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Cooked food stock item deleted!");
      onRefresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-gray-400 shadow">Loading cooked food stock...</div>;
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
                {item.foodName} — {item.quantity} left (min: {item.minStockLevel})
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
          placeholder="Search by food name..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Food Name</th>
              <th className="p-4 text-left">Quantity</th>
              <th className="p-4 text-left">Min Stock</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">Updated At</th>
          <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No cooked food stock found</td></tr>
            ) : (
              filtered.map((item) => {
                const isLow = Number(item.quantity) <= Number(item.minStockLevel);
                return (
                  <tr key={item.id} className={`border-t ${isLow ? "bg-red-50" : ""}`}>
                    <td className="p-4 font-medium">{item.foodName ?? `Item #${item.menuItemId}`}</td>
                    <td className={`p-4 ${isLow ? "text-red-600 font-semibold" : ""}`}>{item.quantity}</td>
                    <td className="p-4 text-gray-500">{item.minStockLevel ?? "0"}</td>
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
                    <td className="p-4 text-gray-500 max-w-xs truncate">{item.description || "-"}</td>
                        <td className="p-4 text-sm text-gray-400">{item.createdAt ? new Date(item.createdAt.endsWith("Z") || item.createdAt.includes("+") ? item.createdAt : item.createdAt + "Z").toLocaleString() : "-"}</td>
                <td className="flex p-4 gap-4">
                      <button onClick={() => openEditCooked(item)} className="rounded text-blue-500 text-sm"><Edit size={22} /></button>
                      <button onClick={() => handleDeleteCooked(item.id)} className="rounded text-red-500 text-sm"><Trash2 size={22} /></button>
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

      {showCookedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Edit Cooked Food Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" value={cookedForm.quantity} onChange={(e) => setCookedForm({ ...cookedForm, quantity: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                <input type="number" value={cookedForm.minStockLevel} onChange={(e) => setCookedForm({ ...cookedForm, minStockLevel: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows={3} value={cookedForm.description} onChange={(e) => setCookedForm({ ...cookedForm, description: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button onClick={() => { setShowCookedModal(false); setEditingCooked(null); }} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCookedUpdate} disabled={savingCooked} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                {savingCooked ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
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

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
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