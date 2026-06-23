"use client";
import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  code: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

interface PromotionForm {
  title: string;
  description: string;
  discountType: string;
  discountValue: string;
  code: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
}

const emptyForm: PromotionForm = { title: "", description: "", discountType: "percentage", discountValue: "", code: "", isActive: true, startsAt: "", endsAt: "", usageLimit: "" };

export default function PromotionsClient() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("success");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [downloadType, setDownloadType] = useState("");

  const handleDownload = (value: string) => {
    setDownloadType(value);
    switch (value) {
      case "pdf":
        window.location.href = "/api/download/pdf";
        console.log("pdf downloaded");
        break;

      case "csv":
        window.location.href = "/api/download/csv";
        console.log("csv downloaded");
        break;

      case "excel":
        window.location.href = "/api/download/excel";
        console.log("excel downloaded");
        break;
    }
  };


  const filteredPromotions = useMemo(() => {
    if (!search.trim()) return promotions;
    const q = search.toLowerCase();
    return promotions.filter((p) => p.title.toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q));
  }, [promotions, search]);


  useEffect(() => {
    async function loadPromotions() {
      try {
        const res = await fetch("/api/superadmin/promotions");
        const data = await res.json();
        if (!data.error) setPromotions(data.promotions ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPromotions();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(promo: Promotion) {
    setEditing(promo);
    setForm({
      title: promo.title,
      description: promo.description ?? "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      code: promo.code ?? "",
      isActive: promo.isActive,
      startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : "",
      endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : "",
      usageLimit: promo.usageLimit?.toString() ?? "",
    });
    setShowModal(true);
  }

  function buildBody() {
    return {
      ...form,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const url = "/api/superadmin/promotions";
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { id: editing.id, ...buildBody() } : buildBody();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) { setMessage(data.error); setMessageType("error"); return; }

      setShowModal(false);
      router.refresh();
      // await loadPromotions();
    } catch {
      setMessage("Failed to save promotion");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const res = await fetch(`/api/superadmin/promotions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); setMessageType("error"); return; }
      router.refresh();
      // await loadPromotions();
    } catch {
      setMessage("Failed to delete promotion");
      setMessageType("error");
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <div className="flex items-center justify-end gap-4">
          <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select value={downloadType} onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
          <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">+ Add Promotion</button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{message}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search promotions..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Discount</th>
              <th className="p-4 text-left">Usage</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPromotions.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No promotions found</td></tr>
            ) : (
              filteredPromotions.map((promo) => (
                <tr key={promo.id} className="border-t">
                  <td className="p-4 font-medium">{promo.title}</td>
                  <td className="p-4 text-gray-500">{promo.code ?? "-"}</td>
                  <td className="p-4">{promo.discountValue}{promo.discountType === "percentage" ? "%" : " Rs."}</td>
                  <td className="p-4 text-gray-500">{promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => openEdit(promo)} className="mr-2 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">Edit</button>
                    <button onClick={() => handleDelete(promo.id)} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Promotion" : "Add Promotion"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border p-3" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="mt-1 w-full rounded-lg border p-3">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Value</label>
                  <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="isActive" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
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