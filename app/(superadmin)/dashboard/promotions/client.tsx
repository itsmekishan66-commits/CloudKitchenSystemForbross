"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Edit, Trash2 } from "lucide-react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import Checkbox from "@/app/_components/Checkbox";

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
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
  image: string;
  discountType: string;
  discountValue: string;
  code: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
}

type ModalMode = "promotion" | "offer";

const emptyForm: PromotionForm = {
  title: "",
  description: "",
  image: "",
  discountType: "percentage",
  discountValue: "",
  code: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
};

export default function PromotionsClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("promotion");
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("success");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  const filteredPromotions = useMemo(() => {
    if (!search.trim()) return promotions;
    const q = search.toLowerCase();
    return promotions.filter((p) => p.title.toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q));
  }, [promotions, search]);

  const totalPages = Math.ceil(filteredPromotions.length / perPage);
  const start = (page - 1) * perPage;
  const visiblePromotions = filteredPromotions.slice(start, start + perPage);

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

  useEffect(() => {
    let isMounted = true;

    const fetchPromotions = async () => {
      try {
        const res = await fetch("/api/superadmin/promotions");
        const data = await res.json();
        if (!data.error && isMounted) setPromotions(data.promotions ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchPromotions();

    return () => {
      isMounted = false;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalMode("promotion");
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  function openEdit(promo: Promotion) {
    setEditing(promo);
    setModalMode(promo.image ? "offer" : "promotion");
    setForm({
      title: promo.title,
      description: promo.description ?? "",
      image: promo.image ?? "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      code: promo.code ?? "",
      isActive: promo.isActive,
      startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : "",
      endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : "",
      usageLimit: promo.usageLimit?.toString() ?? "",
    });
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be less than 5 MB." }));
      event.target.value = "";
      return;
    }

    setUploadingImage(true);
    setErrors((prev) => { const next = { ...prev }; delete next.image; return next; });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
        return;
      }
      setForm((prev) => ({ ...prev, image: data.path ?? "" }));
    } catch {
      setMessage("Image upload failed");
      setMessageType("error");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  function buildBody() {
    return {
      ...form,
      image: form.image || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
  }

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Title is required.";
    if (!form.discountValue.toString().trim()) newErrors.discountValue = "Discount value is required.";
    if (!form.code.trim()) newErrors.code = "Promo code is required.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (editing) {
      const noChange =
        form.title === editing.title &&
        form.description === (editing.description ?? "") &&
        form.image === (editing.image ?? "") &&
        form.discountType === editing.discountType &&
        form.discountValue === editing.discountValue &&
        form.code === (editing.code ?? "") &&
        form.isActive === editing.isActive &&
        form.startsAt === (editing.startsAt ? editing.startsAt.slice(0, 16) : "") &&
        form.endsAt === (editing.endsAt ? editing.endsAt.slice(0, 16) : "") &&
        form.usageLimit === (editing.usageLimit?.toString() ?? "");
      if (noChange) {
        setMessage("Nothing to update.");
        setMessageType("success");
        return;
      }
    }

    setErrors({});
    setMessage("");
    setSaving(true);

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

      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
        return;
      }

      setShowModal(false);
      await loadPromotions();
      setMessage(editing ? "Promotion updated" : modalMode === "offer" ? "Offer created" : "Promotion created");
      setMessageType("success");
    } catch {
      setMessage("Failed to save promotion");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!await confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const res = await fetch(`/api/superadmin/promotions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
        return;
      }
      await loadPromotions();
      setMessage("Promotion deleted");
      setMessageType("success");
    } catch {
      setMessage("Failed to delete promotion");
      setMessageType("error");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Promotions</h1>
        <div className="flex items-center flex-wrap gap-3">
          {can("CREATE_PROMOTIONS") && (
            <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 font-semibold text-white hover:bg-orange-600">
              + Add Promotion and Offers
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
          {message}
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
           value={search}
           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
           placeholder="Search promotions..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="overflow-x-auto no-scrollbar rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Image</th>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Discount</th>
              <th className="p-4 text-left">Usage</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No promotions found
                </td>
              </tr>
            ) : (
              visiblePromotions.map((promo) => (
                <tr key={promo.id} className="border-t">
                  <td className="p-4 font-medium">{promo.title}</td>
                  <td className="p-4">
                    {promo.image ? (
                      <img src={promo.image} alt={promo.title} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span className="text-sm text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{promo.code ?? "-"}</td>
                  <td className="p-4">
                    {promo.discountValue}
                    {promo.discountType === "percentage" ? "%" : " Rs."}
                  </td>
                  <td className="p-4 text-gray-500">{promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="flex p-4 gap-4">
                    {can("UPDATE_PROMOTIONS") && (
                      <button onClick={() => openEdit(promo)} className="rounded text-blue-500 text-sm">
                        <Edit size={22} />
                      </button>
                    )}
                    {can("DELETE_PROMOTIONS") && (
                      <button onClick={() => handleDelete(promo.id)} className="rounded text-red-500 text-sm">
                        <Trash2 size={22} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filteredPromotions.length} promotions)
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[95vw] sm:max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editing ? (modalMode === "offer" ? "Edit Offer" : "Edit Promotion") : modalMode === "offer" ? "Add Offer" : "Add Promotion"}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} className={`mt-1 w-full rounded-lg border p-3 ${errors.title ? "border-red-400" : ""}`} />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="mt-1 w-full rounded-lg border p-3" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Offer Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 w-full rounded-lg border p-3" />
                {uploadingImage ? <p className="mt-2 text-sm text-gray-500">Uploading image...</p> : null}
                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                {form.image ? (
                  <img src={form.image} alt="Offer preview" className="mt-3 h-28 w-full rounded-lg object-cover" />
                ) : (
                  <p className="mt-2 text-sm text-gray-400">No image selected yet.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <select value={form.discountType} onChange={(e) => updateForm("discountType", e.target.value)} className="mt-1 w-full rounded-lg border p-3">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Value *</label>
                  <input type="number" step="0.01" value={form.discountValue} onChange={(e) => updateForm("discountValue", e.target.value)} className={`mt-1 w-full rounded-lg border p-3 ${errors.discountValue ? "border-red-400" : ""}`} />
                  {errors.discountValue && <p className="mt-1 text-sm text-red-500">{errors.discountValue}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Code *</label>
                <input type="text" value={form.code} onChange={(e) => updateForm("code", e.target.value)} className={`mt-1 w-full rounded-lg border p-3 ${errors.code ? "border-red-400" : ""}`} />
                {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => updateForm("startsAt", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => updateForm("endsAt", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => updateForm("usageLimit", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="isActive" />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </form>
            {message && (
              <div className={`mt-3 rounded-lg p-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                {message}
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button onClick={() => { setShowModal(false); setErrors({}); setMessage(""); }} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
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