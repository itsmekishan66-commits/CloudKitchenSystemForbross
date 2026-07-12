"use client";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import Checkbox from "@/app/_components/Checkbox";

interface Kitchen {
  id: number;
  name: string;
  slug: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  managerName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface KitchenForm {
  name: string;
  slug: string;
  location: string;
  phone: string;
  email: string;
  managerName: string;
  isActive: boolean;
}

const emptyForm: KitchenForm = { name: "", slug: "", location: "", phone: "", email: "", managerName: "", isActive: true };

const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  staff: "Staff",
  "kitchen-manager": "Kitchen Manager",
  "payment-manager": "Payment Manager",
  "support-staff": "Support Staff",
  customer: "Customer",
};

export default function KitchenClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Kitchen | null>(null);
  const [form, setForm] = useState<KitchenForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rolesList, setRolesList] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  const filteredKitchens = useMemo(() => {
    if (!search.trim()) return kitchens;
    const q = search.toLowerCase();
    return kitchens.filter((k) => k.name.toLowerCase().includes(q) || (k.location ?? "").toLowerCase().includes(q) || (k.managerName ?? "").toLowerCase().includes(q));
  }, [kitchens, search]);

  const totalPages = Math.ceil(filteredKitchens.length / perPage);
  const start = (page - 1) * perPage;
  const visibleKitchens = filteredKitchens.slice(start, start + perPage);

  async function loadKitchens() {
    try {
      const res = await fetch("/api/superadmin/kitchens");
      const data = await res.json();
      if (!data.error) setKitchens(data.kitchens ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchKitchens() {
      await loadKitchens();
    }
    void fetchKitchens();

    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setRolesList(data.roles ?? []);
      })
      .catch(console.error);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  function openEdit(kitchen: Kitchen) {
    setEditing(kitchen);
    setForm({
      name: kitchen.name,
      slug: kitchen.slug,
      location: kitchen.location ?? "",
      phone: kitchen.phone ?? "",
      email: kitchen.email ?? "",
      managerName: kitchen.managerName ?? "",
      isActive: kitchen.isActive,
    });
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function updateField(field: keyof KitchenForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSave() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "This field is required.";
    if (!form.slug.trim()) next.slug = "This field is required.";
    if (!editing) {
      if (!form.email.trim()) next.email = "This field is required.";
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
      if (!form.managerName.trim()) next.managerName = "This field is required.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) {
      const unchanged =
        form.name === editing.name &&
        form.slug === editing.slug &&
        form.location === (editing.location ?? "") &&
        form.phone === (editing.phone ?? "") &&
        form.email === (editing.email ?? "") &&
        form.managerName === (editing.managerName ?? "") &&
        form.isActive === editing.isActive;
      if (unchanged) {
        setMessage("Nothing to update.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      if (editing) {
        const res = await fetch("/api/superadmin/kitchens", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      } else {
        const res = await fetch("/api/superadmin/kitchens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      }

      setShowModal(false);
      await loadKitchens();
    } catch {
      setMessage("Failed to save kitchen");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!await confirm("Are you sure you want to delete this kitchen?")) return;
    try {
      const res = await fetch(`/api/superadmin/kitchens?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      await loadKitchens();
    } catch {
      setMessage("Failed to delete kitchen");
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Kitchens</h1>
        <div className="flex items-center flex-wrap gap-3">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
          {can("CREATE_KITCHENS") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600">+ Add Kitchen</button>}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
           value={search}
           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
           placeholder="Search kitchens..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto  no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Location</th>
              <th className="p-4 text-left">Manager</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody >
            {visibleKitchens.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No kitchens found</td></tr>
            ) : (
              visibleKitchens.map((kitchen) => (
                <tr key={kitchen.id} className="border-t">
                  <td className="p-2 md:p-4 font-medium">{kitchen.name}</td>
                  <td className="p-2 md:p-4 text-gray-500">{kitchen.slug}</td>
                  <td className="p-3 md:p-4 text-gray-500">{kitchen.managerName ?? "-"}</td>
                  <td className="p-2 md:p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${kitchen.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kitchen.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="flex p-4 gap-4">
                    {can("UPDATE_KITCHENS") && <button onClick={() => openEdit(kitchen)} className="rounded text-blue-500 text-sm"><Edit size={22} /></button>}
                    {can("DELETE_KITCHENS") && <button onClick={() => handleDelete(kitchen.id)} className="rounded text-red-500 text-sm"><Trash2 size={22} /></button>}
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
            Page {page} of {totalPages} ({filteredKitchens.length} kitchens)
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
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Kitchen" : "Add Kitchen"}</h2>
             <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => { const v = e.target.value; setForm((prev) => ({ ...prev, name: v, slug: editing ? prev.slug : generateSlug(v) })); setErrors((prev) => { if (!prev.name) return prev; const n = { ...prev }; delete n.name; return n; }); }} className="mt-1 w-full rounded-lg border p-3" />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={form.location} onChange={(e) => updateField("location", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manager Name</label>
                <select value={form.managerName} onChange={(e) => updateField("managerName", e.target.value)} className="mt-1 w-full rounded-lg border p-3 bg-white">
                  <option value="">Select role</option>
                  {rolesList
                    .filter((r) => r.name !== "customer")
                    .map((r) => (
                      <option key={r.id} value={r.name}>{ROLE_LABELS[r.name] ?? r.name}</option>
                    ))}
                </select>
                {errors.managerName && <p className="mt-1 text-sm text-red-500">{errors.managerName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} id="isActive" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            {message && (
              <p className="mt-4 text-sm text-red-500">{message}</p>
            )}
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