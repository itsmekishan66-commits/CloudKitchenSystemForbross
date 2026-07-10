"use client";
import { CircleArrowDown, Edit, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";

const ROLE_OPTIONS = [
  // {label: "Super Admin", value: "super-admin"},
  { label: "Customer", value: "customer" },
  { label: "Staff", value: "staff" },
  { label: "Kitchen Manager", value: "kitchen-manager" },
  { label: "Payment Manager", value: "payment-manager" },
  { label: "Support Staff", value: "support-staff" },
  { label: "Admin", value: "admin" },
];

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
}

const emptyForm = { name: "", email: "", password: "", role: "customer", phone: "", address: "" };



export default function CustomersClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("customer");
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  
  //to download the file
   const handleDownload = (type: string) => {
    if (type) {
      window.open(`/api/exports/${type}?source=users`, "_blank");
    }
  };

 

  useEffect(() => { 
     const fetchUsers = () => {
    const params = filter ? `?role=${filter}` : "";
    setLoading(true);
    fetch(`/api/users${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUsers(data.users ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
    fetchUsers(); 
  }, [filter]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateForm = (isEdit: boolean) => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "This field is required.";
    if (!form.email.trim()) {
      next.email = "This field is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!isEdit) {
      if (!form.password) next.password = "This field is required.";
      else if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    } else if (form.password && form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm(false)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create user"); return; }
      setShowAddModal(false);
      setForm(emptyForm);
      router.refresh();
      // fetchUsers();
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
    setError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setError("");
    if (!validateForm(true)) return;

    const isUnchanged =
      form.name === editUser.name &&
      form.email === editUser.email &&
      form.phone === (editUser.phone ?? "") &&
      form.address === (editUser.address ?? "") &&
      form.role === editUser.role &&
      !form.password;

    if (isUnchanged) {
      setError("Nothing to update.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };
      if (editUser.role !== "super-admin") body.role = form.role;
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update user"); return; }
      setEditUser(null);
      setForm(emptyForm);

      router.refresh();
      // fetchUsers();
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteConfirm = async (user: User) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) { setError("Failed to delete user"); return; }
      router.refresh();
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q));
  }, [users, search]);

  const roleColors: Record<string, string> = {
    "super-admin": "bg-red-100 text-red-700",
    admin: "bg-purple-100 text-purple-700",
    staff: "bg-blue-100 text-blue-700",
    customer: "bg-green-100 text-green-700",
    manager: "bg-amber-100 text-amber-700",
    delivery: "bg-cyan-100 text-cyan-700",
    kitchen: "bg-slate-100 text-slate-700",
  };

  const tabs = [
    { label: "All", value: "" },
    { label: "Customers", value: "customer" },
    { label: "Staff", value: "staff" },
    { label: "kitchen-managers", value: "kitchen-manager" },
    { label: "payment-managers", value: "payment-manager" },
    { label: "support-staff", value: "support-staff" },
    { label: "Admins", value: "admin" },
    { label: "Super Admins", value: "super-admin" },
  ];

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
        <h1 className="text-xl sm:text-2xl font-bold">Customers & Users <span className="text-sm sm:text-base font-normal text-gray-400 ml-2">({users.length} {filter === "" ? "total" : filter})</span></h1>
        <div className="flex items-center flex-wrap gap-3">
          {can("DOWNLOAD_USERS") && (
          <button className="flex gap-2 rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="text-sm bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
          )}
          {can("CREATE_USERS") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-md font-medium text-white shadow hover:bg-orange-600 transition-colors">
            + Add User
          </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.value
                ? "bg-orange-500 text-white shadow"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Joined</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4 text-gray-500">{user.phone ?? "-"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${roleColors[user.role] ?? "bg-gray-100"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      {can("UPDATE_USERS") && (
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded text-blue-500 text-sm"
                      >
                        <Edit size={22} />
                      </button>
                      )}
                      {can("DELETE_USERS") && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete User",
                            message: `Are you sure you want to delete ${user.name} (${user.email})? The user will be hidden from the system but their data will be preserved.`,
                            confirmText: "Delete",
                            variant: "danger",
                          });
                          if (ok) handleDeleteConfirm(user);
                        }}
                        className="rounded text-red-500 text-sm"
                      >
                        <Trash2 size={22} />
                      </button>
                      )}
                      {can("VIEW_USERS") && user.role==="customer" && (
                      <button
                        onClick={() => router.push(`/dashboard/customers/${user.id}`)}
                        className="text-black"
                      >
                        <Eye size={22} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add User</h2>
              <button onClick={() => { setShowAddModal(false); setError(""); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} noValidate className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" value={form.phone} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input name="address" value={form.address} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select name="role" value={form.role} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-medium text-white shadow hover:bg-orange-600 disabled:opacity-50 transition-colors">
                {submitting ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[95vw] sm:max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit User</h2>
              <button onClick={() => { setEditUser(null); setError(""); setForm(emptyForm); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                <input name="password" type="password" value={form.password} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" value={form.phone} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input name="address" value={form.address} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                {editUser?.role === "super-admin" ? (
                  <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    super-admin <span className="text-gray-400 ml-1">(cannot be changed)</span>
                  </div>
                ) : (
                  <select name="role" value={form.role} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-medium text-white shadow hover:bg-orange-600 disabled:opacity-50 transition-colors">
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}