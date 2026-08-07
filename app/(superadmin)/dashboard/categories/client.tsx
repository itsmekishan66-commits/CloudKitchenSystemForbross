"use client";
// import { CircleArrowDown, } from 'lucide-react';
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import Checkbox from "@/app/_components/Checkbox";
import { Edit, Trash2, Search } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
  type: 'menu' | 'inventory';
  createdAt: string;
}

interface CategoryForm {
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
  type: 'menu' | 'inventory';
}

const emptyForm: CategoryForm = { name: "", slug: "", image: "", isActive: true, type: "menu" };

export default function CategoriesClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  //to download the file
  // const [open, setOpen] = useState(false);
  // const [downloadType, setDownloadType] = useState("");

  // const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      cat.type.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filteredCategories.length / perPage);
  const start = (page - 1) * perPage;
  const visibleCategories = filteredCategories.slice(start, start + perPage);

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
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image ?? "", isActive: cat.isActive, type: cat.type });
    setErrors({});
    setMessage("");
    setShowModal(true);
  }

  function updateForm(field: keyof CategoryForm, value: string | boolean) {
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
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) {
      const unchanged =
        form.name === editing.name &&
        form.slug === editing.slug &&
        (form.image || "") === (editing.image ?? "") &&
        form.isActive === editing.isActive &&
        form.type === editing.type;
      if (unchanged) {
        setMessage("Nothing to update.");
        return;
      }
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
    if (!await confirm("Are you sure you want to delete this category?")) return;
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Categories</h1>
        <div className="flex items-center flex-wrap gap-3">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select  value={downloadType} onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>  
            </select>
          </button> */}
          {can("CREATE_CATEGORIES") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600">+ Add Category</button>}
        </div>
      </div>


      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Slug</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCategories.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No categories found</td></tr>
            ) : (
              visibleCategories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-gray-500">{cat.slug}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${cat.type === 'menu' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {cat.type === 'menu' ? "Menu" : "Inventory"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="flex p-4 gap-4">
                    {can("UPDATE_CATEGORIES") && <button onClick={() => openEdit(cat)} className="mr-2 rounded text-blue-500 text-sm"><Edit size={22} /></button>}
                    {can("DELETE_CATEGORIES") && <button onClick={() => handleDelete(cat.id)} className="rounded text-red-500 text-sm"><Trash2 size={22} /></button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filteredCategories.length} categories)
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
            >
              <span aria-hidden="true">←</span> Prev
            </button>
            {(() => {
              const windowStart = Math.floor((page - 1) / 10) * 10 + 1;
              const windowEnd = Math.min(totalPages, windowStart + 9);
              const pages: number[] = [];
              for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-9.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
                    p === page ? "bg-orange-500 text-white" : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ));
            })()}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editing ? "Edit Category" : "Add Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="menu" checked={form.type === "menu"} onChange={(e) => updateForm("type", e.target.value as 'menu' | 'inventory')} className="text-orange-500" />
                    <span className="text-sm">Menu (shows on frontend)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="inventory" checked={form.type === "inventory"} onChange={(e) => updateForm("type", e.target.value as 'menu' | 'inventory')} className="text-orange-500" />
                    <span className="text-sm">Inventory (internal only)</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.isActive} onChange={(e) => updateForm("isActive", e.target.checked)} id="isActive" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            {message && (
              <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
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