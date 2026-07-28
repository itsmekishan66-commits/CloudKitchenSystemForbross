"use client";
import { Edit, Trash2, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import toast from "react-hot-toast";

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
  rating: string;
  reviews: string;
}

const emptyForm: MenuForm = { title: "", slug: "", categoryId: null, price: "", image: "", description: "", badge: "", isAvailable: true, discountPercent: "", addons: [], rating: "", reviews: "" };

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
  conversionUnit: string | null;
  conversionValue: string | null;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
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
  const [recipeErrors, setRecipeErrors] = useState<Record<string, string>>({});
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);


  // this is for cooking from recipe
  const [cookModal, setCookModal] = useState<{ recipeId: number; recipeTitle: string; menuItemId: number } | null>(null);
  const [cookBatchCount, setCookBatchCount] = useState(1);
  const [cooking, setCooking] = useState(false);
  const [cookError, setCookError] = useState("");

  // this is for admin reviews
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ menuItemId: 0, userName: "", rating: "5", userAvatar: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewAvatarUploading, setReviewAvatarUploading] = useState(false);
  const [reviewHovered, setReviewHovered] = useState(0);

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

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const start = (page - 1) * perPage;
  const visibleItems = filteredItems.slice(start, start + perPage);

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
    setErrors({});
    setShowModal(true);
  }

  async function handleCookFromRecipe() {
    if (!cookModal) return;
    const batchCount = Math.max(1, cookBatchCount);
    setCooking(true);
    setCookError("");
    try {
      const res = await fetch("/api/superadmin/cooked-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: cookModal.recipeId,
          quantity: batchCount,
          batchCount,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); setCookError(data.error); return; }
      toast.success(`Cooked ${data.quantityProduced} servings from recipe!`);
      setCookModal(null);
      setCookBatchCount(1);
      void loadRecipes(cookModal.menuItemId);
    } catch {
      toast.error("Failed to cook recipe"); setCookError("Failed to cook recipe");
    } finally {
      setCooking(false);
    }
  }

  async function handleCookMenuItem(menuItemId: number, menuItemTitle: string) {
    try {
      const res = await fetch(`/api/superadmin/recipes?menuItemId=${menuItemId}`);
      const data = await res.json();
      const recipesList = data.recipes ?? [];
      if (recipesList.length === 0) {
        toast.error(`No recipe defined for "${menuItemTitle}"`);
        return;
      }
      if (recipesList.length === 1) {
        setCookModal({ recipeId: recipesList[0].id, recipeTitle: recipesList[0].title, menuItemId });
        setCookBatchCount(1);
        return;
      }
      openRecipeList(menuItemId, menuItemTitle);
    } catch {
      toast.error("Failed to load recipes");
    }
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
    setRecipeErrors({});
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
    setRecipeErrors({});
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

  function updateRecipeForm<K extends keyof RecipeForm>(field: K, value: RecipeForm[K]) {
    setRecipeForm((prev) => ({ ...prev, [field]: value }));
    setRecipeErrors((prev) => {
      const key = field as string;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setErrors({});
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
      rating: item.rating ?? "",
      reviews: String(item.reviews ?? ""),
    });
    setShowModal(true);
  }
  function generateSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function updateForm<K extends keyof MenuForm>(field: K, value: MenuForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const key = field as string;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSave() {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "This field is required.";
    if (!form.slug.trim()) next.slug = "This field is required.";
    if (!form.categoryId) next.categoryId = "This field is required.";
    if (!form.price.trim()) next.price = "This field is required.";
    if (!form.image.trim()) next.image = "Image is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) {
      const norm = (v: string | null) => (v ?? "").trim();
      const formAddons = form.addons.map((a) => ({ name: a.name.trim(), price: a.price }));
      const editAddons = (editing.addons ?? []).map((a) => ({ name: (a.name ?? "").trim(), price: String(a.price ?? "") }));
      const unchanged =
        norm(form.title) === norm(editing.title) &&
        norm(form.slug) === norm(editing.slug) &&
        form.categoryId === editing.categoryId &&
        norm(form.price) === norm(editing.price) &&
        (form.image || "") === (editing.image ?? "") &&
        (form.description || "") === (editing.description ?? "") &&
        (form.badge || "") === (editing.badge ?? "") &&
        form.isAvailable === editing.isAvailable &&
        (form.discountPercent || "") === (editing.discountPercent ?? "") &&
        (form.rating || "") === (editing.rating ?? "") &&
        (form.reviews || "") === String(editing.reviews ?? "") &&
        JSON.stringify(formAddons) === JSON.stringify(editAddons);
      if (unchanged) {
        setMessage("Nothing to update.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      image: form.image || null,
      description: form.description || null,
      badge: form.badge || null,
      discountPercent: form.discountPercent || null,
      rating: form.rating || null,
      reviews: form.reviews ? Number(form.reviews) : 0,
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
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be 5 MB or less." }));
      return;
    }
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
      updateForm("image", data.path);
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
    const next: Record<string, string> = {};
    if (!recipeForm.menuItemId) next.menuItemId = "This field is required.";
    if (!recipeForm.title.trim()) next.title = "This field is required.";
    if (!recipeForm.prepTime.trim()) next.prepTime = "This field is required.";
    if (!recipeForm.cookTime.trim()) next.cookTime = "This field is required.";
    if (!(Number(recipeForm.servings) > 0)) next.servings = "Servings must be greater than 0.";
    if (!recipeForm.instructions.trim()) next.instructions = "This field is required.";
    if (recipeForm.ingredients.filter((i) => i.inventoryItemId && i.quantity).length === 0) {
      next.ingredients = "Add at least one ingredient.";
    }
    setRecipeErrors(next);
    if (Object.keys(next).length > 0) return;

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
    setRecipeErrors((prev) => { if (!prev.ingredients) return prev; const n = { ...prev }; delete n.ingredients; return n; });
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

  // this is for admin reviews

  async function handleReviewAvatarUpload(file: File) {
    const formData = new FormData();
    formData.append("files", file);
    setReviewAvatarUploading(true);
    try {
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      const url = data.urls?.[0];
      if (url) {
        setReviewForm((prev) => ({ ...prev, userAvatar: url }));
        toast.success("Avatar uploaded");
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setReviewAvatarUploading(false);
    }
  }

  async function handleCreateReview() {
    if (!reviewForm.menuItemId || !reviewForm.userName.trim()) {
      toast.error("Select a menu item and enter customer name");
      return;
    }
    setReviewSaving(true);
    try {
      const res = await fetch("/api/superadmin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: reviewForm.menuItemId,
          userName: reviewForm.userName.trim(),
          rating: Number(reviewForm.rating),
          userAvatar: reviewForm.userAvatar || null,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Review added");
      setReviewForm({ menuItemId: 0, userName: "", rating: "5", userAvatar: "" });
      void loadData();
    } catch {
      toast.error("Failed to add review");
    } finally {
      setReviewSaving(false);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Menu Items</h1>
        <div className="flex items-center justify-end gap-2 sm:gap-4 flex-wrap">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}

          {can("CREATE_MENUS") && <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600">+ Add Item</button>}

          {can("VIEW_RECIPES") && <button onClick={() => { setEditingRecipeId(null); setRecipeForm(emptyRecipeForm); setRecipeView("form"); setShowRecipeModal(true); void loadInventoryOptions(); }} className="rounded-xl bg-green-600 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-green-700">+ Add menu recipe</button>}

          {can("CREATE_MENUS") && <button onClick={() => { setShowReviewModal(true); }} className="rounded-xl bg-yellow-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-yellow-600">+ Add Review</button>}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search menu items.."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
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
            {visibleItems.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No menu items found</td></tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4">Rs.{item.price}</td>
                  <td className="p-4">{item.rating} ({item.reviews})</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${item.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="flex p-4 gap-4">
                    {can("UPDATE_MENUS") && <button onClick={() => openEdit(item)} className="rounded text-blue-500 text-sm"><Edit size={22} /></button>}
                    {can("DELETE_MENUS") && <button onClick={() => handleDelete(item.id)} className="rounded text-red-500 text-sm"><Trash2 size={22} /></button>}
                    {can("VIEW_RECIPES") && <button onClick={() => handleCookMenuItem(item.id, item.title)} className="rounded bg-orange-500 px-3 py-1 text-white text-sm hover:bg-orange-600">Cook</button>}
                    {can("VIEW_RECIPES") && <button onClick={() => openRecipeList(item.id, item.title)} className="rounded bg-green-600 px-3 py-1 text-white text-sm">Recipes</button>}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {editing ? "Edit Menu Item" : "Add Menu Item"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Create and manage menu items for your kitchen.
              </p>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-8 space-y-6">

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Item Title
                </label>

                <input type="text" value={form.title} onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({ ...prev, title: v, slug: editing ? prev.slug : generateSlug(v) }));
                  setErrors((prev) => { if (!prev.title) return prev; const n = { ...prev }; delete n.title; return n; });
                }}
                  placeholder="Wagyu Gold Burger"
                  className=" w-full rounded-xl border border-slate-200 bg-slate-50 px-4py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Slug
                </label>

                <input type="text" value={form.slug}
                  onChange={(e) => updateForm("slug", e.target.value)}
                  placeholder="wagyu-gold-burger"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50  px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
              </div>

              {/* Category + Price */}
              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select value={form.categoryId ?? ""} onChange={(e) =>
                    updateForm("categoryId", e.target.value ? Number(e.target.value) : null)
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
                  {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price
                  </label>

                  <input type="number" step="0.01" value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    placeholder="299.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

              </div>

              {/* Image URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Image URL
                  </label>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="text-sm text-orange-600 font-medium disabled:opacity-50"
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
                  updateForm("image", e.target.value)
                }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}

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

              {/* Rating + Reviews */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rating <span className="text-gray-400 font-normal">(0 - 5)</span>
                  </label>
                  <input type="number" step="0.5" min="0" max="5" value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    placeholder="e.g. 4.5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Reviews <span className="text-gray-400 font-normal">(count)</span>
                  </label>
                  <input type="number" min="0" value={form.reviews}
                    onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                    placeholder="e.g. 120"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
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
                    className="text-sm text-orange-600 font-medium"
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

            {message && (
              <div className="px-4 sm:px-8 pb-2">
                <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t bg-white px-4 sm:px-8 py-4 sm:py-5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-3xl">

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
                <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
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
                        className="rounded-xl bg-green-600 px-5 py-2.5 text-white font-semibold hover:bg-green-700 whitespace-nowrap"
                      >
                        + Add Recipe
                      </button>
                    )}
                  </div>
                </div>

                {/* Body - menu item selector when no menu item selected */}
                {!recipeListMenuItemId && (
                  <div className="p-4 sm:p-8">
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
                  <div className="p-4 sm:p-8">
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
                                  {can("VIEW_RECIPES") && (
                                    <button onClick={() => { openRecipeEdit(recipe); void loadInventoryOptions(); }}
                                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-white text-sm"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {can("VIEW_RECIPES") && (
                                    <button onClick={() => { setCookModal({ recipeId: recipe.id, recipeTitle: recipe.title, menuItemId: recipe.menuItemId }); setCookBatchCount(1); }}
                                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-white text-sm hover:bg-orange-600"
                                    >
                                      Cook
                                    </button>
                                  )}
                                  {can("VIEW_RECIPES") && (
                                    <button onClick={() => handleRecipeDelete(recipe.id)}
                                      className="rounded-lg bg-red-500 px-3 py-1.5 text-white text-sm"
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
                <div className="border-t bg-white px-4 sm:px-8 py-4 sm:py-5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-3xl">
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
                <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                    {editingRecipeId ? "Edit Recipe" : "Add Recipe"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {editingRecipeId ? "Update the recipe details below." : "Define recipe details and ingredients."}
                  </p>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-8 space-y-6">

                  {recipeMessage && (
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{recipeMessage}</div>
                  )}

                  {/* Menu Item selector */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Menu Item</label>
                    <select value={recipeForm.menuItemId ?? ""} onChange={(e) => updateRecipeForm("menuItemId", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    >
                      <option value="">Select Menu Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                    {recipeErrors.menuItemId && <p className="mt-1 text-sm text-red-500">{recipeErrors.menuItemId}</p>}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Recipe Title</label>
                    <input type="text" value={recipeForm.title} onChange={(e) => updateRecipeForm("title", e.target.value)}
                      placeholder="e.g. Classic Margherita"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                    {recipeErrors.title && <p className="mt-1 text-sm text-red-500">{recipeErrors.title}</p>}
                  </div>

                  {/* Prep, Cook, Servings */}
                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Prep Time</label>
                      <input type="text" value={recipeForm.prepTime} onChange={(e) => updateRecipeForm("prepTime", e.target.value)}
                        placeholder="15 mins"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                      {recipeErrors.prepTime && <p className="mt-1 text-sm text-red-500">{recipeErrors.prepTime}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Cook Time</label>
                      <input type="text" value={recipeForm.cookTime} onChange={(e) => updateRecipeForm("cookTime", e.target.value)}
                        placeholder="25 mins"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                      {recipeErrors.cookTime && <p className="mt-1 text-sm text-red-500">{recipeErrors.cookTime}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Servings</label>
                      <input type="number" min="1" value={recipeForm.servings} onChange={(e) => updateRecipeForm("servings", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500"
                      />
                      {recipeErrors.servings && <p className="mt-1 text-sm text-red-500">{recipeErrors.servings}</p>}
                    </div>
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
                    <textarea rows={4} value={recipeForm.instructions} onChange={(e) => updateRecipeForm("instructions", e.target.value)}
                      placeholder="Step-by-step preparation instructions..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 resize-none outline-none transition focus:border-green-500"
                    />
                    {recipeErrors.instructions && <p className="mt-1 text-sm text-red-500">{recipeErrors.instructions}</p>}
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
                              const smallestUnit = option?.conversionUnit || option?.unit || "";
                              updated[idx] = {
                                ...updated[idx],
                                inventoryItemId: invId,
                                inventoryItemName: option?.name ?? "",
                                unit: smallestUnit,
                              };
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            className="flex-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-500"
                          >
                            <option value="">-- Select --</option>
                            {inventoryOptions.map((opt) => {
                              const labelUnit = opt.conversionUnit || opt.unit;
                              return (
                                <option key={opt.id} value={opt.id}>{opt.name} ({labelUnit})</option>
                              );
                            })}
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
                      {recipeErrors.ingredients && <p className="mt-2 text-sm text-red-500">{recipeErrors.ingredients}</p>}
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
                <div className="border-t bg-white px-4 sm:px-8 py-4 sm:py-5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-3xl">
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
                <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{viewingRecipe.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">Recipe details and ingredients</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm whitespace-nowrap ${viewingRecipe.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {viewingRecipe.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-8 space-y-6">
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
                <div className="border-t bg-white px-4 sm:px-8 py-4 sm:py-5 flex justify-end gap-3 rounded-b-3xl">
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

      {/* Cook from Recipe Modal */}
      {cookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setCookModal(null); setCookError(""); }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">Cook Recipe</h2>
            </div>
            {cookError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {cookError}
              </div>
            )}
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm text-slate-600">
                Cooking: <span className="font-semibold text-slate-800">{cookModal.recipeTitle}</span>
              </p>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Batch Count</label>
                <input type="number" min={1} value={cookBatchCount} onChange={(e) => setCookBatchCount(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                <p className="mt-1 text-xs text-slate-400">Each batch produces the recipe&apos;s serving size.</p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setCookModal(null); setCookBatchCount(1); }}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button onClick={handleCookFromRecipe} disabled={cooking}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {cooking ? "Cooking..." : "Cook Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Review</h2>
              <button onClick={() => { setShowReviewModal(false); setReviewForm({ menuItemId: 0, userName: "", rating: "5", userAvatar: "" }); setReviewHovered(0); }}
                className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="mb-1 block text-sm font-medium">Menu Item *</label>
                <select value={reviewForm.menuItemId || ""}
                  onChange={(e) => setReviewForm((p) => ({ ...p, menuItemId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100">
                  <option value="">Select menu item</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Customer Name *</label>
                <input value={reviewForm.userName}
                  onChange={(e) => setReviewForm((p) => ({ ...p, userName: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Avatar</label>
                <div className="flex items-center gap-3">
                  {reviewForm.userAvatar ? (
                    <img src={reviewForm.userAvatar} alt="Avatar" className="h-12 w-12 rounded-full object-cover border" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {reviewForm.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 inline-block">
                      {reviewAvatarUploading ? "Uploading..." : "Upload Image"}
                    </span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleReviewAvatarUpload(f); }} />
                  </label>
                  {reviewForm.userAvatar && (
                    <button type="button" onClick={() => setReviewForm((p) => ({ ...p, userAvatar: "" }))}
                      className="text-sm text-red-500 hover:underline">Remove</button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Rating *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeVal = reviewHovered || Number(reviewForm.rating);
                    const isFull = activeVal >= star;
                    const isHalf = !isFull && activeVal >= star - 0.5;
                    return (
                      <div key={star} className="relative w-7 h-7">
                        {/* Left half click zone for x.5 */}
                        <button
                          type="button"
                          onMouseEnter={() => setReviewHovered(star - 0.5)}
                          onMouseLeave={() => setReviewHovered(0)}
                          onClick={() => setReviewForm((p) => ({ ...p, rating: String(star - 0.5) }))}
                          className="absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                        />
                        {/* Right half click zone for full star */}
                        <button
                          type="button"
                          onMouseEnter={() => setReviewHovered(star)}
                          onMouseLeave={() => setReviewHovered(0)}
                          onClick={() => setReviewForm((p) => ({ ...p, rating: String(star) }))}
                          className="absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                        />
                        {/* Empty star background */}
                        <Star size={28} className="absolute inset-0 text-gray-300" />
                        {/* Full filled star */}
                        {isFull && (
                          <Star size={28} className="absolute inset-0 fill-amber-400 text-amber-400" />
                        )}
                        {/* Half filled star */}
                        {isHalf && (
                          <span className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star size={28} className="fill-amber-400 text-amber-400" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {Number(reviewForm.rating) > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-600">
                      {reviewForm.rating}/5
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setShowReviewModal(false); setReviewForm({ menuItemId: 0, userName: "", rating: "5", userAvatar: "" }); setReviewHovered(0); }}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleCreateReview} disabled={reviewSaving}
                className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50">
                {reviewSaving ? "Saving..." : "Add Review"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}