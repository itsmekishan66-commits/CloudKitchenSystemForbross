"use client";
// import { CircleArrowDown, } from 'lucide-react';
import { useEffect, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CategoryForm {
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
}

const emptyForm: CategoryForm = { name: "", slug: "", image: "", isActive: true };

export default function CategoriesClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  //to download the file
  // const [open, setOpen] = useState(false);
  // const [downloadType, setDownloadType] = useState("");

  // const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  async function loadCategories() {

    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!data.error) setCategories(data.categories ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // defer loading to avoid synchronous setState inside effect
    const t = setTimeout(() => { loadCategories(); }, 0);
    return () => clearTimeout(t);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image ?? "", isActive: cat.isActive });
    setShowModal(true);
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
        const res = await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form, image: form.image || null }),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      }

      setShowModal(false);
      await loadCategories();
    } catch {
      setMessage("Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      await loadCategories();
    } catch {
      setMessage("Failed to delete category");
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl justify-around font-bold">Categories</h1>
        <div className="flex items-center justify-end gap-4 mb-6">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select  value={downloadType} onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>  
            </select>
          </button> */}
          {can("CREATE_CATEGORIES") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">+ Add Category</button>}
        </div>
      </div>


      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Slug</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">No categories found</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-gray-500">{cat.slug}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    {can("UPDATE_CATEGORIES") && <button onClick={() => openEdit(cat)} className="mr-2 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">Edit</button>}
                    {can("DELETE_CATEGORIES") && <button onClick={() => handleDelete(cat.id)} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Category" : "Add Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
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