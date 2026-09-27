"use client";
import { CircleArrowDown, Edit, Eye, Power, Trash2, TriangleAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import Pagination from "@/app/_components/Pagination";
import toast from "react-hot-toast";

// Roles that must never be assignable from the user form
const FORBIDDEN_ROLE_OPTIONS = new Set(["admin", "super-admin"]);

// Legacy / seeded accounts created by db/seed/users.ts. These must never be
// edited or deleted from the UI (they are demo/seed data).
const LEGACY_USER_EMAILS = new Set([
  "superadmin@example.com",
  "admin@example.com",
  "manager@example.com",
  "payment@example.com",
  "staff@example.com",
  "supportstaff@example.com",
  "customer@example.com",
]);
const isLegacyUser = (email: string | null | undefined) =>
  !!email && LEGACY_USER_EMAILS.has(email.toLowerCase());

// Fallback if the roles API fails — still excludes admin & super-admin
const FALLBACK_ROLE_OPTIONS = [
  { label: "Customer", value: "customer" },
  { label: "Staff", value: "staff" },
  { label: "Kitchen Manager", value: "kitchen-manager" },
  { label: "Payment Manager", value: "payment-manager" },
  { label: "Support Staff", value: "support-staff" },
];

// "kitchen-manager" -> "Kitchen Manager"
const upperRole = (role: string) =>
  role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
  isGuest?: boolean;
}

const emptyForm = { name: "", email: "", password: "", role: "customer", phone: "", address: "" };

// Every value the ?tab= param accepts. "recovery" is not a role — it switches the
// page into the danger zone and pulls soft-deleted users instead.
const TAB_VALUES = [
  "",
  "customer",
  "staff",
  "kitchen-manager",
  "payment-manager",
  "support-staff",
  "admin",
  "super-admin",
  "recovery",
];



export default function CustomersClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // Role tabs live in the URL (?tab=...) so a refresh keeps the active tab.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const filter = urlTab === null
    ? "customer"
    : TAB_VALUES.includes(urlTab)
      ? urlTab
      : "customer";
  // The Recovery tab is gated behind VIEW_USERS *and* DELETE_USERS, so a
  // ?tab=recovery deep link can never expose it to a lesser role.
  const isRecovery = filter === "recovery" && can("VIEW_USERS") && can("DELETE_USERS");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  // Recovery (danger zone) state — kept separate from the role tabs above so
  // switching tabs never leaks a filter into the other list.
  const [recoverySearch, setRecoverySearch] = useState("");
  const [recoveryRole, setRecoveryRole] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const fetchUsers = useCallback(async () => {
    // Recovery reads the soft-deleted rows; every other tab reads the active ones.
    const params = isRecovery ? "?deleted=true" : filter ? `?role=${filter}` : "";
    setLoading(true);
    fetch(`/api/users${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUsers(data.users ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, isRecovery]);

  useEffect(() => {
    setTimeout(() => {
      fetchUsers();
    });
  }, [fetchUsers]);
  const [roleOptions, setRoleOptions] =
    useState<{ label: string; value: string }[]>(FALLBACK_ROLE_OPTIONS);

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        const options = (data.roles ?? [])
          .filter((r: { name: string }) => !FORBIDDEN_ROLE_OPTIONS.has(r.name))
          .map((r: { name: string }) => ({
            label: upperRole(r.name),
            value: r.name,
          }));
        if (options.length > 0) setRoleOptions(options);
      })
      .catch(console.error);
  }, []);

  // Options for the edit modal: includes the current role even if it's
  // protected (e.g. "admin"), so admins can retain their own role.
  const editRoleOptions = useMemo(() => {
    if (!editUser) return roleOptions;
    if (editUser.role === "super-admin") return roleOptions;
    const hasCurrent = roleOptions.some((o) => o.value === editUser.role);
    if (hasCurrent) return roleOptions;
    return [
      { label: upperRole(editUser.role), value: editUser.role },
      ...roleOptions,
    ];
  }, [editUser, roleOptions]);

  const selectFilter = (value: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  //to download the file
  const handleDownload = (type: string) => {
    if (type) {
      window.open(`/api/exports/${type}?source=users`, "_blank");
    }
  };

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
      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        toast.error(data.error ?? "Failed to create user");
        return;
      }
      setShowAddModal(false);
      setForm(emptyForm);
      toast.success("User created successfully");
      router.refresh();
      fetchUsers();
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
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
      if (!res.ok) {
        setError(data.error ?? "Failed to update user");
        toast.error(data.error ?? "Failed to update user");
        return;
      }
      setEditUser(null);
      setForm(emptyForm);
      toast.success("User updated successfully");

      router.refresh();
      fetchUsers();
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    finally { setSubmitting(false); }
  };

  const handleDeleteConfirm = async (user: User) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error ?? "Failed to delete user";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("User deleted");
      router.refresh();
      fetchUsers();
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    finally { setSubmitting(false); }
  };

  // Recovery tab toggle. Deleted users are always in the "deactivate" state, so
  // the left/green side is the one that does work: it restores the account.
  const handleStatusToggle = async (user: User, next: "active" | "inactive") => {
    const willActivate = next === "active";
    const ok = await confirm({
      title: willActivate ? "Activate User" : "Deactivate User",
      message: willActivate
        ? `Are you sure you want to activate ${user.name} (${user.email})? The account will be restored and the user will be able to sign in again.`
        : `Are you sure you want to deactivate ${user.name} (${user.email})? The user will be hidden from the system but their data will be preserved.`,
      confirmText: willActivate ? "Activate" : "Deactivate",
      variant: willActivate ? "success" : "danger",
    });
    if (!ok) return;

    setTogglingId(user.id);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: !willActivate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error ?? `Failed to ${willActivate ? "activate" : "deactivate"} user`;
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(willActivate ? `${user.name} activated` : `${user.name} deactivated`);
      router.refresh();
      fetchUsers();
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    finally { setTogglingId(null); }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q));
  }, [users, search]);

  // The stored page can point past the end after a restore or a filter change,
  // so clamp it during render instead of syncing it back with an effect.
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const visibleUsers = filteredUsers.slice(start, start + perPage);

  // One distinct hue per role name that actually exists in db/seed/roles.ts.
  // Amber is left free for the Guest badge below.
  const roleColors: Record<string, string> = {
    "super-admin": "bg-red-100 text-red-700",
    admin: "bg-purple-100 text-purple-700",
    "kitchen-manager": "bg-orange-100 text-orange-800",
    "payment-manager": "bg-teal-100 text-teal-800",
    "support-staff": "bg-cyan-100 text-cyan-800",
    staff: "bg-blue-100 text-blue-700",
    customer: "bg-green-100 text-green-700",
  };

  // Guest checkouts are stored with roleId = NULL, so the joined role name comes
  // back empty. Label those rows "Guest" in sand yellow rather than a blank badge.
  const roleLabel = (user: User) => (user.isGuest ? "Guest" : user.role || "-");
  const roleBadge = (user: User) =>
    user.isGuest ? "bg-amber-100 text-amber-800" : roleColors[user.role] ?? "bg-gray-100";

  const tabs: { label: string; value: string; danger?: boolean }[] = [
    { label: "All", value: "" },
    { label: "Customers", value: "customer" },
    { label: "Staff", value: "staff" },
    { label: "kitchen-managers", value: "kitchen-manager" },
    { label: "payment-managers", value: "payment-manager" },
    { label: "support-staff", value: "support-staff" },
    { label: "Admins", value: "admin" },
    { label: "Super Admins", value: "super-admin" },
    // Danger section — only for roles that may delete users.
    ...(can("VIEW_USERS") && can("DELETE_USERS")
      ? [{ label: "Recovery", value: "recovery", danger: true }]
      : []),
  ];

  // Recovery list: soft-deleted users only, narrowed live as the admin types.
  const recoveryUsers = useMemo(() => {
    const q = recoverySearch.trim().toLowerCase();
    return users
      .filter((u) => u.deleted)
      .filter((u) => (recoveryRole ? u.role === recoveryRole : true))
      .filter((u) =>
        q
          ? u.name.toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q) ||
            (u.phone ?? "").toLowerCase().includes(q)
          : true,
      );
  }, [users, recoverySearch, recoveryRole]);

  const recoveryRoles = useMemo(
    () => Array.from(new Set(users.filter((u) => u.deleted).map((u) => u.role))).sort(),
    [users],
  );

  const recoveryTotalPages = Math.max(1, Math.ceil(recoveryUsers.length / perPage));
  const recoveryCurrentPage = Math.min(page, recoveryTotalPages);
  const visibleRecoveryUsers = recoveryUsers.slice((recoveryCurrentPage - 1) * perPage, (recoveryCurrentPage - 1) * perPage + perPage);

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
        <h1 className="text-xl sm:text-2xl font-bold">
          {isRecovery ? (
            <span className="text-red-600">Recovery — Deleted Users </span>
          ) : (
            <>Customers & Users </>
          )}
          <span className="text-sm sm:text-base font-normal text-gray-400 ml-2">
            ({users.length} {isRecovery ? "deleted" : filter === "" ? "total" : filter})
          </span>
        </h1>
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
          {can("CREATE_USERS") && !isRecovery && (
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
            onClick={() => selectFilter(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === t.value
              ? t.danger
                ? "bg-red-600 text-white shadow"
                : "bg-orange-500 text-white shadow"
              : t.danger
                ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!isRecovery && (
      <>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            {visibleUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found</td></tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4 text-gray-500">{user.phone ?? "-"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${roleBadge(user)}`}>
                      {roleLabel(user)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      {!isLegacyUser(user.email) && can("UPDATE_USERS") && (
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded text-blue-500 text-sm"
                        >
                          <Edit size={22} />
                        </button>
                      )}
                      {!isLegacyUser(user.email) && can("DELETE_USERS") && (
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
                      {can("VIEW_USERS") && user.role === "customer" && (
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

      <Pagination
        total={filteredUsers.length}
        perPage={perPage}
        page={currentPage}
        onPage={setPage}
        label="Users"
      />
      </>
      )}

      {/* Recovery — danger zone. Lists only soft-deleted users and lets a
          super-admin put any of them back with the activate/deactivate toggle. */}
      {isRecovery && (
        <>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <TriangleAlert size={20} className="mt-0.5 shrink-0 text-red-600" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Danger zone — deleted users</p>
              <p className="text-red-700">
                These accounts are soft-deleted and hidden everywhere in the system, but
                their data is still intact. Activating one restores it immediately.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={recoverySearch}
              onChange={(e) => { setRecoverySearch(e.target.value); setPage(1); }}
              placeholder="Search deleted users by name, email or phone..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
            <select
              value={recoveryRole}
              onChange={(e) => { setRecoveryRole(e.target.value); setPage(1); }}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-56"
            >
              <option value="">All roles</option>
              {recoveryRoles.map((r) => (
                <option key={r} value={r}>{upperRole(r)}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar border border-red-100">
            <table className="w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="p-4 text-left text-red-800">Name</th>
                  <th className="p-4 text-left text-red-800">Email</th>
                  <th className="p-4 text-left text-red-800">Phone</th>
                  <th className="p-4 text-left text-red-800">Role</th>
                  <th className="p-4 text-left text-red-800">Last Updated</th>
                  <th className="p-4 text-left text-red-800">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecoveryUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      {users.length === 0
                        ? "No deleted users found"
                        : "No deleted users match your search"}
                    </td>
                  </tr>
                ) : (
                  visibleRecoveryUsers.map((user) => {
                    const isActive = !user.deleted;
                    return (
                    <tr key={user.id} className="border-t hover:bg-red-50/40">
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4 text-gray-500">{user.email}</td>
                      <td className="p-4 text-gray-500">{user.phone ?? "-"}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-sm ${roleBadge(user)}`}>
                          {roleLabel(user)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">
                        {/* Two-sided toggle: left = activate, right = deactivate.
                            Whichever side is current owns the colour — green while
                            the account is active, red while it is deactivated. */}
                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5">
                          <button
                            type="button"
                            aria-pressed={isActive}
                            disabled={isActive || togglingId === user.id}
                            onClick={() => handleStatusToggle(user, "active")}
                            title="Restore this user"
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                              isActive
                                ? "bg-green-500 text-white shadow"
                                : "text-gray-500 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                            }`}
                          >
                            <Power size={12} />
                            Active
                          </button>
                          <button
                            type="button"
                            aria-pressed={!isActive}
                            disabled={!isActive || togglingId === user.id}
                            onClick={() => handleStatusToggle(user, "inactive")}
                            title="Hide this user again"
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                              isActive
                                ? "text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                : "bg-red-500 text-white shadow"
                            }`}
                          >
                            <Power size={12} />
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            total={recoveryUsers.length}
            perPage={perPage}
            page={recoveryCurrentPage}
            onPage={setPage}
            label="Deleted users"
          />
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl my-4">
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900">Add User</h2>
              <button onClick={() => { setShowAddModal(false); setError(""); }} className="rounded-md p-2 hover:bg-gray-200">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleInput} placeholder="Full name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleInput} placeholder="Phone number" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleInput} placeholder="user@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                  <input name="password" type="password" value={form.password} onChange={handleInput} placeholder="Min. 8 characters" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={form.role} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white">
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input name="address" value={form.address} onChange={handleInput} placeholder="Street, city, etc." className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setError(""); }} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
          <div className="w-full max-w-[95vw] sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl my-4">
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => { setEditUser(null); setError(""); setForm(emptyForm); }} className="rounded-md p-2 hover:bg-gray-200">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                  <input name="password" type="password" value={form.password} onChange={handleInput} placeholder="Min. 8 characters" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  {editUser?.role === "super-admin" ? (
                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      super-admin <span className="text-gray-400 ml-1">(cannot be changed)</span>
                    </div>
                  ) : (
                    <select name="role" value={form.role} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white">
                      {editRoleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input name="address" value={form.address} onChange={handleInput} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <button type="button" onClick={() => { setEditUser(null); setError(""); setForm(emptyForm); }} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}