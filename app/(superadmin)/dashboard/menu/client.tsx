"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

interface MenuItem {
  id: number;
  title: string;
  slug: string;
  categoryId: number | null;
  price: string;
  image: string | null;
  description: string | null;
  badge: string | null;
  rating: string;
  reviews: number;
  isAvailable: boolean;
  addons: Addon[] | null;
  discountPercent: string | null;
}

interface Addon {
  name?: string;
  price?: number | string;
}

interface Category {
  id: number;
  name: string;
}

type AddonRow = { name: string; price: string };

interface MenuForm {
  title: string;
  slug: string;
  categoryId: number | null;
  price: string;
  image: string;
  description: string;
  badge: string;
  isAvailable: boolean;
  discountPercent: string;
  addons: AddonRow[];
}

const emptyForm: MenuForm = { title: "", slug: "", categoryId: null, price: "", image: "", description: "", badge: "", isAvailable: true, discountPercent: "", addons: [] };

export default function MenuClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, search]);

  async function loadData() {
    try {
      const [itemsRes, catRes] = await Promise.all([
        fetch("/api/menu-items"),
        fetch("/api/categories"),
      ]);
      const itemsData = await itemsRes.json();
      const catData = await catRes.json();
      if (!itemsData.error) setItems(itemsData.items ?? []);
      if (!catData.error) setCategories(catData.categories ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchItems() {
      await loadData();
    }
    void fetchItems();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    const existingAddons: AddonRow[] = Array.isArray(item.addons) ? item.addons.map((a: Addon) => ({ name: a.name || "", price: String(a.price ?? 0) })) : [];
    setForm({
      title: item.title,
      slug: item.slug,
      categoryId: item.categoryId,
      price: item.price,
      image: item.image ?? "",
      description: item.description ?? "",
      badge: item.badge ?? "",
      isAvailable: item.isAvailable,
      discountPercent: item.discountPercent ?? "",
      addons: existingAddons,
    });
    setShowModal(true);
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.price) {
      setMessage("Title, slug, and price are required");
      return;
    }
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      image: form.image || null,
      description: form.description || null,
      badge: form.badge || null,
      discountPercent: form.discountPercent || null,
      addons: form.addons.filter((a) => a.name.trim()),
    };

    try {
      if (editing) {
        const res = await fetch("/api/menu-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      } else {
        const res = await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.error) { setMessage(data.error); return; }
      }

      setShowModal(false);
      await loadData();
    } catch {
      setMessage("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        return;
      }
      setForm({ ...form, image: data.path });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/menu-items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      await loadData();
    } catch {
      setMessage("Failed to delete menu item");
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
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <div className="flex items-center justify-end gap-4">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
          {can("CREATE_MENUS") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600">+ Add Item</button>}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items.."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Rating</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No menu items found</td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4">Rs.{item.price}</td>
                  <td className="p-4">{item.rating} ({item.reviews})</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${item.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="p-4">
                    {can("UPDATE_MENUS") && <button onClick={() => openEdit(item)} className="mr-2 rounded bg-blue-500 px-3 py-1 text-white text-sm hover:bg-blue-600">Edit</button>}
                    {can("DELETE_MENUS") && <button onClick={() => handleDelete(item.id)} className="rounded bg-red-500 px-3 py-1 text-white text-sm hover:bg-red-600">Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b px-8 py-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-slate-800">
                {editing ? "Edit Menu Item" : "Add Menu Item"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Create and manage menu items for your kitchen.
              </p>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Item Title
                </label>

                <input type="text" value={form.title} onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: editing
                      ? form.slug
                      : generateSlug(e.target.value),
                  })
                }
                  placeholder="Wagyu Gold Burger"
                  className=" w-full rounded-xl border border-slate-200 bg-slate-50 px-4py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Slug
                </label>

                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value,
                    })
                  }
                  placeholder="wagyu-gold-burger"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50  px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Category + Price */}
              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value,
                      })
                    }
                    placeholder="299.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

              </div>

              {/* Image URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Image URL
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Image"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  value={form.image}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                {form.image && (
                  <div className="mt-4">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="
                  h-56
                  w-full
                  rounded-2xl
                  object-cover
                  border
                "
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your menu item..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 resize-none outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Discount (%) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Badge */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Badge
                </label>

                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      badge: e.target.value,
                    })
                  }
                  placeholder="Popular, Chef's Special, New..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Add-ons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Add-ons / Extras <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, addons: [...form.addons, { name: "", price: "" }] })}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    + Add Add-on
                  </button>
                </div>
                <div className="space-y-2">
                  {form.addons.map((addon, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => {
                          const updated = [...form.addons];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setForm({ ...form, addons: updated });
                        }}
                        placeholder="e.g. Extra Cheese"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addon.price}
                        onChange={(e) => {
                          const updated = [...form.addons];
                          updated[idx] = { ...updated[idx], price: e.target.value };
                          setForm({ ...form, addons: updated });
                        }}
                        placeholder="Price"
                        className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, addons: form.addons.filter((_, i) => i !== idx) })}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.addons.length === 0 && (
                    <p className="text-xs text-gray-400">No add-ons added yet.</p>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div className="rounded-2xl border border-slate-200 p-5 flex items-center justify-between">

                <div>
                  <h4 className="font-semibold text-slate-800">
                    Available
                  </h4>

                  <p className="text-sm text-slate-500">
                    Show this item on customer menu
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      isAvailable: !form.isAvailable,
                    })
                  }
                  className={`relative w-14 h-7 rounded-full transition ${form.isAvailable
                    ? "bg-green-500"
                    : "bg-slate-300"
                    }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${form.isAvailable
                      ? "left-8"
                      : "left-1"
                      }`}
                  />
                </button>

              </div>

            </div>

            {/* Footer */}
            <div className="border-t bg-white px-8 py-5 flex justify-end gap-3 rounded-b-3xl">

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50 "
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Item"}
              </button>

            </div>

          </div>
        </div>
      )}


    </div>
  );
}