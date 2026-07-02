"use client";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import { Truck, Plus, ArrowLeft, Package, ShoppingBag, DollarSign, FileText } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
  paymentTerms: string | null;
  status: "active" | "inactive";
  notes: string | null;
}

interface SupplierProduct {
  id: number;
  supplierId: number;
  name: string;
  category: string | null;
  productType: "direct_sellable" | "inventory";
  purchaseUnit: string | null;
  unitsPerPack: number | null;
  sellUnit: string | null;
  costPrice: string | null;
  margin: string | null;
  sellingPrice: string | null;
  menuItemId: number | null;
  quantity: string | null;
  unit: string | null;
  minStockLevel: string | null;
  inventoryItemId: number | null;
}

interface SupplierSettlement {
  id: number;
  supplierId: number;
  amount: string;
  type: "payment" | "purchase";
  paymentMethod: string | null;
  transactionId: string | null;
  notes: string | null;
  settlementDate: string;
}

const emptySupplierForm: {
  name: string; contactPerson: string; email: string; phone: string; address: string;
  vatNumber: string; paymentTerms: string; status: "active" | "inactive"; notes: string;
} = {
  name: "", contactPerson: "", email: "", phone: "", address: "",
  vatNumber: "", paymentTerms: "", status: "active", notes: "",
};

const emptyProductForm: {
  name: string; category: string; productType: "direct_sellable" | "inventory";
  purchaseUnit: string; unitsPerPack: string; sellUnit: string;
  costPrice: string; margin: string; sellingPrice: string;
  quantity: string; unit: string; minStockLevel: string;
  errors: Record<string, string>;
} = {
  name: "", category: "Other", productType: "direct_sellable",
  purchaseUnit: "Carton", unitsPerPack: "10", sellUnit: "Piece",
  costPrice: "0", margin: "0", sellingPrice: "0",
  quantity: "0", unit: "pcs", minStockLevel: "0",
  errors: {},
};

export default function SuppliersClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // Supplier form modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [saving, setSaving] = useState(false);

  // Detail view
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [detailTab, setDetailTab] = useState<"products" | "settlements">("products");

  // Product form modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  // Settlement form modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<SupplierSettlement | null>(null);
  const [settlementForm, setSettlementForm] = useState({ amount: "", paidNow: "", type: "purchase" as "payment" | "purchase", paymentMethod: "", transactionId: "", notes: "" });

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || (s.contactPerson ?? "").toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q));
  }, [suppliers, search]);

  async function loadSuppliers() {
    try {
      const res = await fetch("/api/superadmin/suppliers");
      const data = await res.json();
      if (!data.error) setSuppliers(data.suppliers ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function loadProducts(supplierId: number) {
    try {
      const res = await fetch(`/api/superadmin/suppliers?id=${supplierId}&type=products`);
      const data = await res.json();
      if (!data.error) setProducts(data.products ?? []);
    } catch { /* ignore */ }
  }

  async function loadSettlements(supplierId: number) {
    try {
      const res = await fetch(`/api/superadmin/suppliers?id=${supplierId}&type=settlement`);
      const data = await res.json();
      if (!data.error) setSettlements(data.settlements ?? []);
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadSuppliers(); }, []);

  // ---- Supplier CRUD ----
  function openCreateSupplier() {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setShowSupplierModal(true);
  }

  function openEditSupplier(s: Supplier) {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      contactPerson: s.contactPerson ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
      vatNumber: s.vatNumber ?? "",
      paymentTerms: s.paymentTerms ?? "",
      status: s.status,
      notes: s.notes ?? "",
    });
    setShowSupplierModal(true);
  }

  async function handleSaveSupplier() {
    if (!supplierForm.name) { setMessage("Name is required"); return; }
    setSaving(true);
    try {
      if (editingSupplier) {
        await fetch("/api/superadmin/suppliers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSupplier.id, ...supplierForm }),
        });
      } else {
        await fetch("/api/superadmin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierForm),
        });
      }
      setShowSupplierModal(false);
      await loadSuppliers();
    } catch {
      setMessage("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSupplier(id: number) {
    if (!await confirm("Delete this supplier and all associated data?")) return;
    try {
      await fetch(`/api/superadmin/suppliers?id=${id}`, { method: "DELETE" });
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
      await loadSuppliers();
    } catch {
      setMessage("Failed to delete");
    }
  }

  // ---- Product CRUD ----
  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setShowProductModal(true);
  }

  function openEditProduct(p: SupplierProduct) {
    setEditingProduct(p);
    setProductForm({
      name: p.name, category: p.category ?? "Other", productType: p.productType,
      purchaseUnit: p.purchaseUnit ?? "Carton", unitsPerPack: (p.unitsPerPack ?? 1).toString(), sellUnit: p.sellUnit ?? "Piece",
      costPrice: p.costPrice ?? "0", margin: p.margin ?? "0", sellingPrice: p.sellingPrice ?? "0",
      quantity: p.quantity ?? "0", unit: p.unit ?? "pcs", minStockLevel: p.minStockLevel ?? "0",
      errors: {},
    });
    setShowProductModal(true);
  }

  function validateProductForm() {
    const e: Record<string, string> = {};
    if (!productForm.name.trim()) e.name = "This field is required";
    if (!productForm.purchaseUnit.trim()) e.purchaseUnit = "This field is required";
    if (!["Kg","Gram","Litre","ml","Pcs"].includes(productForm.purchaseUnit) && (!productForm.unitsPerPack || Number(productForm.unitsPerPack) < 1)) {
      e.unitsPerPack = "Must be at least 1";
    }
    if (productForm.productType === "direct_sellable" && !productForm.sellUnit.trim()) e.sellUnit = "This field is required";
    if (!productForm.costPrice || Number(productForm.costPrice) <= 0) e.costPrice = "Enter a valid cost price";
    if (productForm.productType === "direct_sellable" && (!productForm.margin || Number(productForm.margin) < 0)) {
      e.margin = "Enter a valid margin";
    }
    if (!productForm.quantity || Number(productForm.quantity) < 0) {
      e.quantity = "Enter a valid quantity";
    }
    return e;
  }

  async function handleSaveProduct() {
    const errors = validateProductForm();
    if (Object.keys(errors).length > 0) {
      setProductForm({ ...productForm, errors });
      return;
    }
    setSaving(true);
    try {
      if (editingProduct) {
        await fetch("/api/superadmin/suppliers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, type: "product", ...productForm }),
        });
      } else {
        await fetch("/api/superadmin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "product", supplierId: selectedSupplier!.id, ...productForm }),
        });
      }
      setShowProductModal(false);
      if (selectedSupplier) await loadProducts(selectedSupplier.id);
    } catch {
      setMessage("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: number) {
    if (!await confirm("Delete this product? It will also remove associated menu/inventory items.")) return;
    try {
      await fetch(`/api/superadmin/suppliers?id=${id}&type=product`, { method: "DELETE" });
      if (selectedSupplier) await loadProducts(selectedSupplier.id);
    } catch {
      setMessage("Failed to delete product");
    }
  }

  // ---- Settlement CRUD ----
  async function handleSaveSettlement() {
    if (!settlementForm.amount || Number(settlementForm.amount) <= 0) {
      setMessage("Valid amount is required"); return;
    }
    setSaving(true);
    try {
      if (editingSettlement) {
        await fetch("/api/superadmin/suppliers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSettlement.id, type: "settlement", supplierId: selectedSupplier!.id, amount: settlementForm.amount, settlementType: settlementForm.type, paymentMethod: settlementForm.paymentMethod, transactionId: settlementForm.transactionId, notes: settlementForm.notes }),
        });
      } else {
        const body: any = { supplierId: selectedSupplier!.id, requestType: "settlement", type: settlementForm.type, amount: settlementForm.amount, paymentMethod: settlementForm.paymentMethod, transactionId: settlementForm.transactionId, notes: settlementForm.notes };
        if (settlementForm.type === "purchase" && Number(settlementForm.paidNow) > 0) {
          body.paidNow = settlementForm.paidNow;
        }
        await fetch("/api/superadmin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setShowSettlementModal(false);
      setEditingSettlement(null);
      setSettlementForm({ amount: "", paidNow: "", type: "purchase", paymentMethod: "", transactionId: "", notes: "" });
      if (selectedSupplier) await loadSettlements(selectedSupplier.id);
    } catch {
      setMessage("Failed to save settlement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSettlement(id: number) {
    if (!await confirm("Delete this settlement record?")) return;
    try {
      await fetch(`/api/superadmin/suppliers?id=${id}&type=settlement&supplierId=${selectedSupplier!.id}`, { method: "DELETE" });
      if (selectedSupplier) await loadSettlements(selectedSupplier.id);
    } catch {
      setMessage("Failed to delete settlement");
    }
  }

  // Select supplier for detail view
  function selectSupplier(s: Supplier) {
    setSelectedSupplier(s);
    setDetailTab("products");
    loadProducts(s.id);
    loadSettlements(s.id);
  }

  // Settlement totals
  const settlementSummary = useMemo(() => {
    let totalPurchases = 0, totalPayments = 0;
    settlements.forEach((s) => {
      const amt = Number(s.amount);
      if (s.type === "purchase") totalPurchases += amt;
      else totalPayments += amt;
    });
    return { totalPurchases, totalPayments, balance: totalPurchases - totalPayments };
  }, [settlements]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" /></div>;
  }

  // ---- Detail View ----
  if (selectedSupplier) {
    return (
      <div className="p-6">
        <button onClick={() => setSelectedSupplier(null)} className="flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4">
          <ArrowLeft size={18} /> Back to Suppliers
        </button>

        <div className="rounded-xl bg-white shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{selectedSupplier.name}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedSupplier.contactPerson && `Contact: ${selectedSupplier.contactPerson}`}
                {selectedSupplier.phone && ` | ${selectedSupplier.phone}`}
                {selectedSupplier.email && ` | ${selectedSupplier.email}`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedSupplier.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {selectedSupplier.status}
            </span>
          </div>
          {selectedSupplier.address && <p className="text-sm text-gray-500"><FileText size={14} className="inline mr-1" />{selectedSupplier.address}</p>}
          {selectedSupplier.vatNumber && <p className="text-sm text-gray-500 mt-1">VAT: {selectedSupplier.vatNumber}</p>}
          {selectedSupplier.paymentTerms && <p className="text-sm text-gray-500 mt-1">Terms: {selectedSupplier.paymentTerms}</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setDetailTab("products")} className={`px-4 py-2 rounded-lg font-medium ${detailTab === "products" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <Package size={16} className="inline mr-1" /> Products ({products.length})
          </button>
          <button onClick={() => setDetailTab("settlements")} className={`px-4 py-2 rounded-lg font-medium ${detailTab === "settlements" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <DollarSign size={16} className="inline mr-1" /> Settlements & Dues
          </button>
        </div>

        {message && <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

        {/* Products Tab */}
        {detailTab === "products" && (
          <div className="rounded-xl bg-white shadow">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Products / Inventory</h3>
              {can("CREATE_SUPPLIERS") && (
                <button onClick={openCreateProduct} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white text-sm font-semibold hover:bg-orange-600">
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>
            {products.length === 0 ? (
              <p className="p-6 text-center text-gray-400">No products added yet</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Pack Size</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Cost/Pack</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Margin</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Sell/Unit</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Stock</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const unitsPerPack = p.unitsPerPack ?? 1;
                    const costPerPiece = Number(p.costPrice) / unitsPerPack;
                    const packLabel = p.productType === "direct_sellable"
                      ? `${p.purchaseUnit || "Carton"} × ${unitsPerPack} ${p.sellUnit || "Piece"}(s)`
                      : `${p.purchaseUnit || "Carton"} × ${unitsPerPack}`;
                    return (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">
                        {p.productType === "direct_sellable" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <ShoppingBag size={12} /> Sellable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            <Package size={12} /> Inventory
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{packLabel}</td>
                      <td className="p-3">Rs.{p.costPrice}</td>
                      <td className="p-3">{p.productType === "direct_sellable" ? `${p.margin}%` : "-"}</td>
                      <td className="p-3 font-semibold">{p.productType === "direct_sellable" ? `Rs.${p.sellingPrice}` : "-"}</td>
                      <td className="p-3">{Number(p.quantity) > 0 ? `${p.quantity} ${p.purchaseUnit || "packs"}` : "0"}</td>
                      <td className="p-3">
                        {can("UPDATE_SUPPLIERS") && <button onClick={() => openEditProduct(p)} className="mr-2 rounded bg-blue-500 px-2 py-1 text-white text-xs hover:bg-blue-600">Edit</button>}
                        {can("DELETE_SUPPLIERS") && <button onClick={() => handleDeleteProduct(p.id)} className="rounded bg-red-500 px-2 py-1 text-white text-xs hover:bg-red-600">Delete</button>}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Settlements Tab */}
        {detailTab === "settlements" && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-white shadow p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-500">Credit Purchases</p>
                <p className="text-2xl font-bold text-blue-600">Rs.{settlementSummary.totalPurchases.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Total bought on credit</p>
              </div>
              <div className="rounded-xl bg-white shadow p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-500">Payments Made</p>
                <p className="text-2xl font-bold text-green-600">Rs.{settlementSummary.totalPayments.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Total paid to supplier</p>
              </div>
              <div className="rounded-xl bg-white shadow p-4 border-l-4 border-orange-500">
                <p className="text-sm text-gray-500">Outstanding Due</p>
                <p className={`text-2xl font-bold ${settlementSummary.balance > 0 ? "text-red-600" : "text-gray-600"}`}>
                  Rs.{settlementSummary.balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Pending to clear</p>
              </div>
              <div className="rounded-xl bg-white shadow p-4 border-l-4 border-purple-500">
                <p className="text-sm text-gray-500">Due Status</p>
                <div className="mt-1">
                  {settlementSummary.balance <= 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Paid ✓</span>
                  ) : settlementSummary.totalPayments > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Partial</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white shadow">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Settlement History</h3>
                {can("CREATE_SUPPLIERS") && (
                  <button onClick={() => setShowSettlementModal(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white text-sm font-semibold hover:bg-orange-600">
                    <Plus size={16} /> Add Record
                  </button>
                )}
              </div>
              {settlements.length === 0 ? (
                <p className="p-6 text-center text-gray-400">No settlement records yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Amount</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Method</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Transaction ID</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Notes</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s) => (
                      <tr key={s.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm">{new Date(s.settlementDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.type === "purchase" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {s.type === "purchase" ? "Credit Purchase" : "Payment Made"}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">Rs.{s.amount}</td>
                        <td className="p-3 text-sm text-gray-500">{s.paymentMethod || "-"}</td>
                        <td className="p-3 text-sm text-gray-500">{s.transactionId || "-"}</td>
                        <td className="p-3 text-sm text-gray-500 max-w-38 truncate">{s.notes || "-"}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {can("UPDATE_SUPPLIERS") && (
                              <button onClick={() => { setEditingSettlement(s); setSettlementForm({ amount: s.amount, paidNow: "", type: s.type, paymentMethod: s.paymentMethod || "", transactionId: s.transactionId || "", notes: s.notes || "" }); setShowSettlementModal(true); }} className="rounded bg-blue-500 px-2 py-1 text-white text-xs hover:bg-blue-600">Edit</button>
                            )}
                            {can("DELETE_SUPPLIERS") && (
                              <button onClick={() => handleDeleteSettlement(s.id)} className="rounded bg-red-500 px-2 py-1 text-white text-xs hover:bg-red-600">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-xl font-bold">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                  <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value, errors: { ...productForm.errors, name: "" } })} className={`mt-1 w-full rounded-lg border p-3 ${productForm.errors?.name ? "border-red-400" : ""}`} />
                  {productForm.errors?.name && <p className="text-xs text-red-500 mt-1">{productForm.errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>

                {/* Product Type Radio */}
                {!editingProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 flex-1 hover:border-orange-400 has-checked:border-orange-500 has-checked:bg-orange-50">
                        <input type="radio" name="productType" checked={productForm.productType === "direct_sellable"} onChange={() => setProductForm({ ...productForm, productType: "direct_sellable" })} className="accent-orange-500" />
                        <div>
                          <span className="font-medium text-sm">Directly Sellable</span>
                          <p className="text-xs text-gray-500">Appears in Menu (frontend)</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 flex-1 hover:border-orange-400 has-checked:border-orange-500 has-checked:bg-orange-50">
                        <input type="radio" name="productType" checked={productForm.productType === "inventory"} onChange={() => setProductForm({ ...productForm, productType: "inventory" })} className="accent-orange-500" />
                        <div>
                          <span className="font-medium text-sm">Inventory</span>
                          <p className="text-xs text-gray-500">Appears in Inventory section</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Pack / Purchase Info */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm font-semibold text-orange-700 mb-3">Pack / Purchase Info</p>
                  <div className={`grid ${productForm.productType === "direct_sellable" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Purchase Unit *</label>
                      <select value={productForm.purchaseUnit} onChange={(e) => {
                        const val = e.target.value;
                        const directUnits = ["Kg","Gram","Litre","ml","Pcs"];
                        setProductForm({ ...productForm, purchaseUnit: val, unitsPerPack: directUnits.includes(val) ? "1" : productForm.unitsPerPack, errors: { ...productForm.errors, purchaseUnit: "" } });
                      }} className={`mt-1 w-full rounded-lg border p-2.5 text-sm ${productForm.errors?.purchaseUnit ? "border-red-400" : ""}`}>
                        <option>Carton</option>
                        <option>Box</option>
                        <option>Pack</option>
                        <option>Dozen</option>
                        <option>Case</option>
                        <option>Sack</option>
                        <option>Bag</option>
                        <option>Bottle</option>
                        <option>Tin</option>
                        <option>Jar</option>
                        <option>Bucket</option>
                        <option>Crate</option>
                        <option>Kg</option>
                        <option>Gram</option>
                        <option>Litre</option>
                        <option>ml</option>
                        <option>Pcs</option>
                      </select>
                      {productForm.errors?.purchaseUnit && <p className="text-xs text-red-500 mt-1">{productForm.errors.purchaseUnit}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        {["Kg","Gram","Litre","ml","Pcs"].includes(productForm.purchaseUnit) ? "Per Unit" : "Qty per Unit *"}
                      </label>
                      {["Kg","Gram","Litre","ml","Pcs"].includes(productForm.purchaseUnit) ? (
                        <>
                          <input type="number" value="1" readOnly className="mt-1 w-full rounded-lg border p-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                          <p className="text-xs text-gray-400 mt-1">Bought directly by {productForm.purchaseUnit.toLowerCase()}</p>
                        </>
                      ) : (
                        <>
                          <input type="number" min="1" value={productForm.unitsPerPack} onChange={(e) => {
                            setProductForm({ ...productForm, unitsPerPack: e.target.value, errors: { ...productForm.errors, unitsPerPack: "" } });
                          }} className={`mt-1 w-full rounded-lg border p-2.5 text-sm ${productForm.errors?.unitsPerPack ? "border-red-400" : ""}`} placeholder="10, 25, 5..." />
                          {productForm.errors?.unitsPerPack && <p className="text-xs text-red-500 mt-1">{productForm.errors.unitsPerPack}</p>}
                        </>
                      )}
                    </div>
                    {productForm.productType === "direct_sellable" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Sell Unit *</label>
                      <input type="text" value={productForm.sellUnit} onChange={(e) => {
                        setProductForm({ ...productForm, sellUnit: e.target.value, errors: { ...productForm.errors, sellUnit: "" } });
                      }} className={`mt-1 w-full rounded-lg border p-2.5 text-sm ${productForm.errors?.sellUnit ? "border-red-400" : ""}`} placeholder="Piece, Kg..." />
                      {productForm.errors?.sellUnit && <p className="text-xs text-red-500 mt-1">{productForm.errors.sellUnit}</p>}
                    </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">e.g. <strong>Carton × 10 Piece</strong> or <strong>Sack × 25 Kg</strong></p>
                </div>

                {/* Cost & Pricing */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Pricing</p>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">Cost Price Per {productForm.purchaseUnit || "Pack"} (from supplier) *</label>
                    <input type="number" step="0.01" value={productForm.costPrice} onChange={(e) => {
                      const cost = e.target.value;
                      const upc = Number(productForm.unitsPerPack) || 1;
                      const margin = productForm.margin;
                      const costPerPiece = Number(cost) / upc;
                      const sellingPricePerPiece = costPerPiece * (1 + Number(margin) / 100);
                      setProductForm({ ...productForm, costPrice: cost, sellingPrice: sellingPricePerPiece.toFixed(2), errors: { ...productForm.errors, costPrice: "" } });
                    }} className={`mt-1 w-full rounded-lg border p-3 ${productForm.errors?.costPrice ? "border-red-400" : ""}`} />
                    {productForm.errors?.costPrice && <p className="text-xs text-red-500 mt-1">{productForm.errors.costPrice}</p>}
                    {productForm.productType === "direct_sellable" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Cost per {productForm.sellUnit || "Piece"}: Rs.{Number(productForm.costPrice) / (Number(productForm.unitsPerPack) || 1) || 0}
                    </p>
                    )}
                  </div>

                  {productForm.productType === "direct_sellable" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Margin (%) *</label>
                        <input type="number" step="0.1" value={productForm.margin} onChange={(e) => {
                          const margin = e.target.value;
                          const upc = Number(productForm.unitsPerPack) || 1;
                          const cost = Number(productForm.costPrice);
                          const costPerPiece = cost / upc;
                          const sellingPricePerPiece = costPerPiece * (1 + Number(margin) / 100);
                          setProductForm({ ...productForm, margin, sellingPrice: sellingPricePerPiece.toFixed(2), errors: { ...productForm.errors, margin: "" } });
                        }} className={`mt-1 w-full rounded-lg border p-3 ${productForm.errors?.margin ? "border-red-400" : ""}`} />
                        {productForm.errors?.margin && <p className="text-xs text-red-500 mt-1">{productForm.errors.margin}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sell Price / {productForm.sellUnit || "Piece"}</label>
                        <input type="number" step="0.01" value={productForm.sellingPrice} readOnly className="mt-1 w-full rounded-lg border p-3 bg-green-50 font-semibold" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qty (in {productForm.purchaseUnit || "packs"}) *</label>
                    <input type="number" step="0.01" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value, errors: { ...productForm.errors, quantity: "" } })} className={`mt-1 w-full rounded-lg border p-3 ${productForm.errors?.quantity ? "border-red-400" : ""}`} />
                    {productForm.errors?.quantity && <p className="text-xs text-red-500 mt-1">{productForm.errors.quantity}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Total units: {Number(productForm.quantity) * (Number(productForm.unitsPerPack) || 1)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Min Stock Level (in {productForm.purchaseUnit || "packs"})</label>
                    <input type="number" step="0.01" value={productForm.minStockLevel} onChange={(e) => setProductForm({ ...productForm, minStockLevel: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                    <p className="text-xs text-gray-400 mt-1">Alerts when stock drops below this level in inventory</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowProductModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveProduct} disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Modal */}
        {showSettlementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">{editingSettlement ? "Edit Settlement Record" : "Add Settlement Record"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 flex-1 hover:border-orange-400 has-checked:border-orange-500 has-checked:bg-orange-50">
                      <input type="radio" name="settlementType" checked={settlementForm.type === "purchase"} onChange={() => setSettlementForm({ ...settlementForm, type: "purchase" })} className="accent-orange-500" />
                      <div>
                        <span className="font-medium text-sm">Credit Purchase</span>
                        <p className="text-xs text-gray-500">Bought from supplier, will pay later</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 flex-1 hover:border-orange-400 has-checked:border-orange-500 has-checked:bg-orange-50">
                      <input type="radio" name="settlementType" checked={settlementForm.type === "payment"} onChange={() => setSettlementForm({ ...settlementForm, type: "payment" })} className="accent-orange-500" />
                      <div>
                        <span className="font-medium text-sm">Make Payment</span>
                        <p className="text-xs text-gray-500">Paying towards outstanding due</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {settlementForm.type === "purchase" ? "Total Purchase Amount (Rs.)" : "Payment Amount (Rs.)"}
                  </label>
                  <input type="number" step="0.01" value={settlementForm.amount} onChange={(e) => setSettlementForm({ ...settlementForm, amount: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                {settlementForm.type === "purchase" && !editingSettlement && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="partialPay" checked={Number(settlementForm.paidNow) > 0} onChange={(e) => setSettlementForm({ ...settlementForm, paidNow: e.target.checked ? "0" : "" })} className="accent-orange-500" />
                      <label htmlFor="partialPay" className="text-sm font-medium text-blue-700 cursor-pointer">Paying partially now?</label>
                    </div>
                    {Number(settlementForm.paidNow) > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Amount Paying Now (Rs.)</label>
                        <input type="number" step="0.01" value={settlementForm.paidNow} onChange={(e) => setSettlementForm({ ...settlementForm, paidNow: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" />
                        {Number(settlementForm.amount) > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Will go to credit: <strong>Rs.{Math.max(0, Number(settlementForm.amount) - Number(settlementForm.paidNow)).toFixed(2)}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {(editingSettlement || settlementForm.type === "payment" || Number(settlementForm.paidNow) > 0) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <input type="text" value={settlementForm.paymentMethod} onChange={(e) => setSettlementForm({ ...settlementForm, paymentMethod: e.target.value })} className="mt-1 w-full rounded-lg border p-3" placeholder="cash, bank, etc." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                      <input type="text" value={settlementForm.transactionId} onChange={(e) => setSettlementForm({ ...settlementForm, transactionId: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea value={settlementForm.notes} onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })} className="mt-1 w-full rounded-lg border p-3" rows={3} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowSettlementModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveSettlement} disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- List View ----
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Suppliers & Dealers</h1>
        {can("CREATE_SUPPLIERS") && (
          <button onClick={openCreateSupplier} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">
            <Plus size={18} /> Add Supplier
          </button>
        )}
      </div>

      {message && <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers by name, contact, email..." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <Truck size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No suppliers found</p>
          {can("CREATE_SUPPLIERS") && <p className="text-gray-400 text-sm mt-1">Click &quot;Add Supplier&quot; to get started</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSuppliers.map((s) => (
            <div key={s.id} className="rounded-xl bg-white shadow p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectSupplier(s)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-3">
                    <Truck size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{s.name}</h3>
                    <p className="text-sm text-gray-500">
                      {s.contactPerson && `${s.contactPerson}`}
                      {s.phone && ` | ${s.phone}`}
                      {s.email && ` | ${s.email}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.status}
                  </span>
                  {can("UPDATE_SUPPLIERS") && (
                    <button onClick={(e) => { e.stopPropagation(); openEditSupplier(s); }} className="rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">
                      Edit
                    </button>
                  )}
                  {can("DELETE_SUPPLIERS") && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(s.id); }} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-500">
                {s.address && <span>{s.address}</span>}
                {s.vatNumber && <span>VAT: {s.vatNumber}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                <input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input type="text" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VAT Number</label>
                  <input type="text" value={supplierForm.vatNumber} onChange={(e) => setSupplierForm({ ...supplierForm, vatNumber: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                  <input type="text" value={supplierForm.paymentTerms} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })} className="mt-1 w-full rounded-lg border p-3" placeholder="e.g. Net 30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={supplierForm.status} onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as "active" | "inactive" })} className="mt-1 w-full rounded-lg border p-3">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} className="mt-1 w-full rounded-lg border p-3" rows={3} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSupplierModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveSupplier} disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
