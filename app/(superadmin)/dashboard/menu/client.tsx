"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";

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

// this is the code for menu recipe - types
interface RecipeWithCost {
  id: number;
  menuItemId: number;
  title: string;
  description: string | null;
  instructions: string | null;
  prepTime: string | null;
  cookTime: string | null;
  servings: number;
  image: string | null;
  isActive: boolean;
  totalCost: number;
  costPerServing: number;
  ingredients: Array<{
    id: number;
    inventoryItemId: number;
    inventoryItemName: string;
    quantity: string;
    unit: string;
    notes: string | null;
    pricePerUnit: string;
  }>;
}

interface RecipeForm {
  id?: number;
  menuItemId: number | null;
  title: string;
  description: string;
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  image: string;
  isActive: boolean;
  ingredients: RecipeIngredientRow[];
}

type RecipeIngredientRow = {
  id?: number;
  inventoryItemId: number | null;
  inventoryItemName: string;
  quantity: string;
  unit: string;
  notes: string;
};

type InventoryOption = {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: string;
};

const emptyRecipeForm: RecipeForm = {
  menuItemId: null, title: "", description: "", instructions: "", prepTime: "", cookTime: "",
  servings: "1", image: "", isActive: true, ingredients: [],
};

export default function MenuClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
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

  // this is the code for menu recipe - state
  const [recipeView, setRecipeView] = useState<"list" | "form" | "detail">("list");
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeListMenuItemId, setRecipeListMenuItemId] = useState<number | null>(null);
  const [recipeListMenuItemTitle, setRecipeListMenuItemTitle] = useState("");
  const [recipes, setRecipes] = useState<RecipeWithCost[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeForm, setRecipeForm] = useState<RecipeForm>(emptyRecipeForm);
  const [viewingRecipe, setViewingRecipe] = useState<RecipeWithCost | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [recipeMessage, setRecipeMessage] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const [recipeUploading, setRecipeUploading] = useState(false);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);

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

  // this is the code for menu recipe - open recipe list
  function openRecipeList(menuItemId: number, menuItemTitle: string) {
    setRecipeListMenuItemId(menuItemId);
    setRecipeListMenuItemTitle(menuItemTitle);
    setRecipeView("list");
    setShowRecipeModal(true);
    void loadRecipes(menuItemId);
  }

  // this is the code for menu recipe - open create form
  function openRecipeCreate() {
    setEditingRecipeId(null);
    setRecipeForm({
      ...emptyRecipeForm,
      menuItemId: recipeListMenuItemId,
    });
    setRecipeView("form");
  }

  // this is the code for menu recipe - open edit form
  function openRecipeEdit(recipe: RecipeWithCost) {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      id: recipe.id,
      menuItemId: recipe.menuItemId,
      title: recipe.title,
      description: recipe.description ?? "",
      instructions: recipe.instructions ?? "",
      prepTime: recipe.prepTime ?? "",
      cookTime: recipe.cookTime ?? "",
      servings: String(recipe.servings),
      image: recipe.image ?? "",
      isActive: recipe.isActive,
      ingredients: recipe.ingredients.map((ing) => ({
        id: ing.id,
        inventoryItemId: ing.inventoryItemId,
        inventoryItemName: ing.inventoryItemName,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes ?? "",
      })),
    });
    setRecipeView("form");
  }

  // this is the code for menu recipe - load inventory for dropdown
  async function loadInventoryOptions() {
    try {
      const res = await fetch("/api/superadmin/inventory");
      const data = await res.json();
      if (!data.error) {
        setInventoryOptions(data.items ?? []);
      }
    } catch {
      // silent
    }
  }

  // this is the code for menu recipe - handle image upload
  async function handleRecipeUpload(file: File) {
    setRecipeUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) { console.error(data.error); return; }
      setRecipeForm({ ...recipeForm, image: data.path });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setRecipeUploading(false);
    }
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
    if (!await confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/menu-items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      await loadData();
    } catch {
      setMessage("Failed to delete menu item");
    }
  }

  // this is the code for menu recipe - load recipes
  async function loadRecipes(menuItemId: number) {
    setRecipesLoading(true);
    try {
      const res = await fetch(`/api/superadmin/recipes?menuItemId=${menuItemId}`);
      const data = await res.json();
      if (!data.error) setRecipes(data.recipes ?? []);
    } catch {
      setRecipes([]);
    } finally {
      setRecipesLoading(false);
    }
  }

  // this is the code for menu recipe - save recipe
  async function handleRecipeSave() {
    if (!recipeForm.title || !recipeForm.menuItemId) {
      setRecipeMessage("Title and menu item are required");
      return;
    }
    setRecipeSaving(true);
    setRecipeMessage("");

    const payload = {
      ...recipeForm,
      servings: Number(recipeForm.servings) || 1,
      ingredients: recipeForm.ingredients
        .filter((ing) => ing.inventoryItemId && ing.quantity)
        .map((ing) => ({
          ...(ing.id ? { id: ing.id } : {}),
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit || "pcs",
          notes: ing.notes || undefined,
        })),
    };

    try {
      if (editingRecipeId) {
        const res = await fetch("/api/superadmin/recipes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingRecipeId, ...payload }),
        });
        const data = await res.json();
        if (data.error) { setRecipeMessage(data.error); return; }
      } else {
        const res = await fetch("/api/superadmin/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.error) { setRecipeMessage(data.error); return; }
      }

      setRecipeView("list");
      if (recipeListMenuItemId) {
        await loadRecipes(recipeListMenuItemId);
      }
    } catch {
      setRecipeMessage("Failed to save recipe");
    } finally {
      setRecipeSaving(false);
    }
  }

  // this is the code for menu recipe - delete recipe
  async function handleRecipeDelete(recipeId: number) {
    if (!await confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res = await fetch(`/api/superadmin/recipes?id=${recipeId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setRecipeMessage(data.error); return; }
      if (recipeListMenuItemId) {
        await loadRecipes(recipeListMenuItemId);
      }
    } catch {
      setRecipeMessage("Failed to delete recipe");
    }
  }

  // this is the code for menu recipe - add ingredient row
  function addRecipeIngredientRow() {
    setRecipeForm({
      ...recipeForm,
      ingredients: [
        ...recipeForm.ingredients,
        { inventoryItemId: null, inventoryItemName: "", quantity: "", unit: "", notes: "" },
      ],
    });
  }

  // this is the code for menu recipe - remove ingredient row
  function removeRecipeIngredientRow(idx: number) {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter((_, i) => i !== idx),
    });
  }

  // this is the code for menu recipe - calculate recipe cost from form
  function calculateRecipeCost(): { totalCost: number; costPerServing: number } {
    const totalCost = recipeForm.ingredients.reduce((acc, ing) => {
      if (!ing.inventoryItemId || !ing.quantity) return acc;
      const option = inventoryOptions.find((o) => o.id === ing.inventoryItemId);
      if (!option) return acc;
      return acc + Number(ing.quantity) * Number(option.pricePerUnit);
    }, 0);
    const servings = Number(recipeForm.servings) || 1;
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerServing: Math.round((totalCost / servings) * 100) / 100,
    };
  }

  // this is the code for menu recipe - calculate cost from fetched recipe data
  function calculateRecipeCostForDisplay(recipe: RecipeWithCost): { totalCost: number; costPerServing: number } {
    const totalCost = recipe.ingredients.reduce((acc, ing) => {
      return acc + Number(ing.quantity) * Number(ing.pricePerUnit);
    }, 0);
    const servings = recipe.servings || 1;
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerServing: Math.round((totalCost / servings) * 100) / 100,
    };
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

          {can("VIEW_RECIPES") && <button onClick={() => { setEditingRecipeId(null); setRecipeForm(emptyRecipeForm); setRecipeView("form"); setShowRecipeModal(true); void loadInventoryOptions(); }} className="rounded-xl bg-green-600 px-5 py-3 text-white font-semibold hover:bg-green-700">+ Add menu recipe</button>}
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
                    {can("VIEW_RECIPES") && <button onClick={() => openRecipeList(item.id, item.title)} className="mr-2 rounded bg-green-600 px-3 py-1 text-white text-sm hover:bg-green-700">Recipes</button>}
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

                <input type="text" value={form.slug}
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

                  <select value={form.categoryId ?? ""} onChange={(e) =>
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
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price
                  </label>

                  <input type="number" step="0.01" value={form.price}
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
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Image"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </div>

                <input type="text" value={form.image} onChange={(e) =>
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
                    <img src={form.image} alt="Preview" className=" h-56 w-full rounded-2xl object-cover border" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea rows={4} value={form.description}
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
                <input type="number" step="0.01" min="0" max="100" value={form.discountPercent}
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

                <input type="text" value={form.badge}
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
                  <button type="button"
                    onClick={() => setForm({ ...form, addons: [...form.addons, { name: "", price: "" }] })}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    + Add Add-on
                  </button>
                </div>
                <div className="space-y-2">
                  {form.addons.map((addon, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input type="text" value={addon.name}
                        onChange={(e) => {
                          const updated = [...form.addons];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setForm({ ...form, addons: updated });
                        }}
                        placeholder="e.g. Extra Cheese"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                      <input type="number" step="0.01" min="0" value={addon.price}
                        onChange={(e) => {
                          const updated = [...form.addons];
                          updated[idx] = { ...updated[idx], price: e.target.value };
                          setForm({ ...form, addons: updated });
                        }}
                        placeholder="Price"
                        className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      />
                      <button type="button"
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

                <button type="button"
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

              <button onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50 "
              >
                Cancel
              </button>

              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Item"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* this is the code for menu recipe - recipe modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">

            {recipeView === "list" && (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b px-8 py-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">
                        {recipeListMenuItemTitle
                          ? `Recipes for ${recipeListMenuItemTitle}`
                          : "Add Menu Recipe"}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Manage recipes and ingredients for your menu items.
                      </p>
                    </div>
                    {recipeListMenuItemId && (
                      <button onClick={() => { openRecipeCreate(); void loadInventoryOptions(); }}
                        className="rounded-xl bg-green-600 px-5 py-2.5 text-white font-semibold hover:bg-green-700"
                      >
                        + Add Recipe
                      </button>
                    )}
                  </div>
                </div>

                {/* Body - menu item selector when no menu item selected */}
                {!recipeListMenuItemId && (
                  <div className="p-8">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Select Menu Item</label>
                    <select
                      value={recipeListMenuItemId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const item = items.find((i) => i.id === id);
                        if (id) {
                          setRecipeListMenuItemId(id);
                          setRecipeListMenuItemTitle(item?.title ?? "");
                          void loadRecipes(id);
                          void loadInventoryOptions();
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                    >
                      <option value="">-- Select a menu item --</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Recipe list */}
                {recipeListMenuItemId && (
                  <div className="p-8">
                    {recipeMessage && (
                      <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{recipeMessage}</div>
                    )}

                    {recipesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                      </div>
                    ) : recipes.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-lg mb-2">No recipes yet</p>
                        <p className="text-sm">Click &ldquo;+ Add Recipe&rdquo; to create the first recipe for this item.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recipes.map((recipe) => {
                          const cost = calculateRecipeCostForDisplay(recipe);
                          return (
                            <div key={recipe.id} className="rounded-2xl border border-slate-200 p-5">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-slate-800">{recipe.title}</h3>
                                    <span className={`rounded-full px-3 py-0.5 text-xs ${recipe.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                      {recipe.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                                    {recipe.servings && <span>Servings: {recipe.servings}</span>}
                                    {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
                                    {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
                                    <span>Ingredients: {recipe.ingredients.length}</span>
                                    <span className="font-semibold text-slate-700">Cost: Rs.{cost.totalCost}</span>
                                    <span className="font-semibold text-slate-700">Per serving: Rs.{cost.costPerServing}</span>
                                  </div>
                                  {recipe.ingredients.length > 0 && (
                                    <div className="mt-3 text-xs text-slate-400">
                                      {recipe.ingredients.map((ing, i) => (
                                        <span key={ing.id}>{i > 0 && ", "}{ing.quantity} {ing.unit} {ing.inventoryItemName}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button onClick={() => { setViewingRecipe(recipe); setRecipeView("detail"); }}
                                    className="rounded-lg bg-gray-600 px-3 py-1.5 text-white text-sm hover:bg-gray-700"
                                  >
                                    View
                                  </button>
                                  {can("UPDATE_RECIPES") && (
                                    <button onClick={() => { openRecipeEdit(recipe); void loadInventoryOptions(); }}
                                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-white text-sm hover:bg-blue-600"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {can("DELETE_RECIPES") && (
                                    <button onClick={() => handleRecipeDelete(recipe.id)}
                                      className="rounded-lg bg-red-500 px-3 py-1.5 text-white text-sm hover:bg-red-600"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t bg-white px-8 py-5 flex justify-end gap-3 rounded-b-3xl">
                  <button onClick={() => { setShowRecipeModal(false); setRecipeMessage(""); }}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {recipeView === "form" && (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b px-8 py-6 rounded-t-3xl">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingRecipeId ? "Edit Recipe" : "Add Recipe"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {editingRecipeId ? "Update the recipe details below." : "Define recipe details and ingredients."}
                  </p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                  {recipeMessage && (
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{recipeMessage}</div>
                  )}

                  {/* Menu Item selector */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Menu Item</label>
                    <select value={recipeForm.menuItemId ?? ""} onChange={(e) => setRecipeForm({ ...recipeForm, menuItemId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    >
                      <option value="">Select Menu Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Recipe Title</label>
                    <input type="text" value={recipeForm.title} onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                      placeholder="e.g. Classic Margherita"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  {/* Prep, Cook, Servings */}
                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Prep Time</label>
                      <input type="text" value={recipeForm.prepTime} onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })}
                        placeholder="15 mins"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Cook Time</label>
                      <input type="text" value={recipeForm.cookTime} onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                        placeholder="25 mins"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Servings</label>
                      <input type="number" min="1" value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                  </div>

                  {/* Image */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Image
                      </label>
                      <button type="button" onClick={() => recipeFileInputRef.current?.click()} disabled={recipeUploading}
                        className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                      >
                        {recipeUploading ? "Uploading..." : "Upload Image"}
                      </button>
                      <input ref={recipeFileInputRef} type="file" accept="image/*"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleRecipeUpload(file); e.target.value = ""; }}
                        className="hidden"
                      />
                    </div>
                    <input type="text" value={recipeForm.image} onChange={(e) => setRecipeForm({ ...recipeForm, image: e.target.value })}
                      placeholder="https://example.com/recipe.jpg"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                    />
                    {recipeForm.image && (
                      <div className="mt-4">
                        <img src={recipeForm.image} alt="Recipe preview" className="h-40 w-full rounded-2xl object-cover border" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea rows={2} value={recipeForm.description} onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                      placeholder="Brief description of the recipe..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 resize-none outline-none transition focus:border-green-500"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Instructions</label>
                    <textarea rows={4} value={recipeForm.instructions} onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                      placeholder="Step-by-step preparation instructions..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 resize-none outline-none transition focus:border-green-500"
                    />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Ingredients <span className="text-gray-400 font-normal">(linked to inventory)</span>
                      </label>
                      <button type="button" onClick={addRecipeIngredientRow}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recipeForm.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <select
                            value={ing.inventoryItemId ?? ""}
                            onChange={(e) => {
                              const invId = Number(e.target.value);
                              const option = inventoryOptions.find((o) => o.id === invId);
                              const updated = [...recipeForm.ingredients];
                              updated[idx] = {
                                ...updated[idx],
                                inventoryItemId: invId,
                                inventoryItemName: option?.name ?? "",
                                unit: option?.unit ?? "",
                              };
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            className="flex-[2] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-500"
                          >
                            <option value="">-- Select --</option>
                            {inventoryOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.name} ({opt.unit})</option>
                            ))}
                          </select>
                          <input type="number" step="0.01" min="0" value={ing.quantity}
                            onChange={(e) => {
                              const updated = [...recipeForm.ingredients];
                              updated[idx] = { ...updated[idx], quantity: e.target.value };
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            placeholder="Qty"
                            className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-500"
                          />
                          <input type="text" value={ing.unit}
                            onChange={(e) => {
                              const updated = [...recipeForm.ingredients];
                              updated[idx] = { ...updated[idx], unit: e.target.value };
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            placeholder="Unit"
                            className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-500"
                          />
                          <input type="text" value={ing.notes}
                            onChange={(e) => {
                              const updated = [...recipeForm.ingredients];
                              updated[idx] = { ...updated[idx], notes: e.target.value };
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            placeholder="Notes"
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-500"
                          />
                          <button type="button" onClick={() => removeRecipeIngredientRow(idx)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {recipeForm.ingredients.length === 0 && (
                        <p className="text-xs text-gray-400">No ingredients added yet. Click &ldquo;+ Add Ingredient&rdquo; to link inventory items.</p>
                      )}
                    </div>

                    {/* Cost Summary */}
                    {recipeForm.ingredients.some((ing) => ing.inventoryItemId && ing.quantity) && (
                      <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4">
                        <div className="flex gap-6 text-sm">
                          <span className="font-semibold text-slate-700">
                            Total Cost: <span className="text-green-700">Rs.{calculateRecipeCost().totalCost}</span>
                          </span>
                          <span className="font-semibold text-slate-700">
                            Cost per Serving: <span className="text-green-700">Rs.{calculateRecipeCost().costPerServing}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active toggle */}
                  <div className="rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">Active</h4>
                      <p className="text-sm text-slate-500">Make this recipe available for production</p>
                    </div>
                    <button type="button" onClick={() => setRecipeForm({ ...recipeForm, isActive: !recipeForm.isActive })}
                      className={`relative w-14 h-7 rounded-full transition ${recipeForm.isActive ? "bg-green-500" : "bg-slate-300"}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${recipeForm.isActive ? "left-8" : "left-1"}`} />
                    </button>
                  </div>

                </div>

                {/* Footer */}
                <div className="border-t bg-white px-8 py-5 flex justify-end gap-3 rounded-b-3xl">
                  <button onClick={() => { setRecipeView("list"); setRecipeMessage(""); }}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button onClick={handleRecipeSave} disabled={recipeSaving}
                    className="rounded-xl bg-green-600 px-5 py-2.5 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {recipeSaving ? "Saving..." : editingRecipeId ? "Update Recipe" : "Save Recipe"}
                  </button>
                </div>
              </>
            )}

            {recipeView === "detail" && viewingRecipe && (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b px-8 py-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">{viewingRecipe.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">Recipe details and ingredients</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm ${viewingRecipe.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {viewingRecipe.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                  {/* Image */}
                  {viewingRecipe.image && (
                    <div>
                      <img src={viewingRecipe.image} alt={viewingRecipe.title} className="h-56 w-full rounded-2xl object-cover border" />
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    {viewingRecipe.servings && <span className="font-semibold text-slate-700">Servings: <span className="font-normal">{viewingRecipe.servings}</span></span>}
                    {viewingRecipe.prepTime && <span className="font-semibold text-slate-700">Prep Time: <span className="font-normal">{viewingRecipe.prepTime}</span></span>}
                    {viewingRecipe.cookTime && <span className="font-semibold text-slate-700">Cook Time: <span className="font-normal">{viewingRecipe.cookTime}</span></span>}
                  </div>

                  {/* Cost */}
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                    <div className="flex gap-6 text-sm">
                      <span className="font-semibold text-slate-700">Total Cost: <span className="text-green-700">Rs.{calculateRecipeCostForDisplay(viewingRecipe).totalCost}</span></span>
                      <span className="font-semibold text-slate-700">Cost per Serving: <span className="text-green-700">Rs.{calculateRecipeCostForDisplay(viewingRecipe).costPerServing}</span></span>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingRecipe.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewingRecipe.description}</p>
                    </div>
                  )}

                  {/* Instructions */}
                  {viewingRecipe.instructions && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Instructions</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{viewingRecipe.instructions}</p>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Ingredients</h3>
                    {viewingRecipe.ingredients.length === 0 ? (
                      <p className="text-sm text-gray-400">No ingredients defined.</p>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-3 text-left font-semibold text-slate-600">Item</th>
                              <th className="p-3 text-left font-semibold text-slate-600">Quantity</th>
                              <th className="p-3 text-left font-semibold text-slate-600">Unit</th>
                              <th className="p-3 text-left font-semibold text-slate-600">Notes</th>
                              <th className="p-3 text-right font-semibold text-slate-600">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewingRecipe.ingredients.map((ing, i) => (
                              <tr key={ing.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className="p-3 font-medium">{ing.inventoryItemName}</td>
                                <td className="p-3">{ing.quantity}</td>
                                <td className="p-3 text-slate-500">{ing.unit}</td>
                                <td className="p-3 text-slate-400">{ing.notes ?? "-"}</td>
                                <td className="p-3 text-right">Rs.{Number(ing.quantity) * Number(ing.pricePerUnit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-white px-8 py-5 flex justify-end gap-3 rounded-b-3xl">
                  <button onClick={() => { setRecipeView("list"); setViewingRecipe(null); }}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
                  >
                    Back to List
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}