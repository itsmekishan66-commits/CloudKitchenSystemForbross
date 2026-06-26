"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

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

export default function KitchenClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Kitchen | null>(null);
  const [form, setForm] = useState<KitchenForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  
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
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
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
    setShowModal(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSave() {
    if (!form.name || !form.slug) {
      setMessage("Name and slug are required");
      return;
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
    if (!confirm("Are you sure you want to delete this kitchen?")) return;
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kitchens</h1>
        <div className="flex items-center justify-end gap-4">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
          {can("CREATE_KITCHENS") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">+ Add Kitchen</button>}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search kitchens..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
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
          <tbody>
            {filteredKitchens.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No kitchens found</td></tr>
            ) : (
              filteredKitchens.map((kitchen) => (
                <tr key={kitchen.id} className="border-t">
                  <td className="p-4 font-medium">{kitchen.name}</td>
                  <td className="p-4 text-gray-500">{kitchen.location ?? "-"}</td>
                  <td className="p-4 text-gray-500">{kitchen.managerName ?? "-"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${kitchen.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kitchen.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    {can("UPDATE_KITCHENS") && <button onClick={() => openEdit(kitchen)} className="mr-2 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">Edit</button>}
                    {can("DELETE_KITCHENS") && <button onClick={() => handleDelete(kitchen.id)} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">Delete</button>}
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
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Kitchen" : "Add Kitchen"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manager Name</label>
                <input type="text" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
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