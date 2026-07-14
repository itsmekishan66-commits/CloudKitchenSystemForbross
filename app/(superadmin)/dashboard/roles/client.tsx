"use client";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createRoleWithPermissionsAction , deleteUserAction, getRolePermissionsAction, updateRolePermissionsAction} from "@/app/(superadmin)/_action/roles";
import { useConfirm } from "@/app/_components/ConfirmPopup";
//static code for RBAc gareko bela ko ho
// import { createRoleWithPermissionsAction, updateRolePermissionsAction, deleteUserAction, getRolePermissionsAction } from "@/app/(superadmin)/_action/roles";

import toast from "react-hot-toast";
import { usePermissions } from "@/lib/permission-context";
import { rolePermissions, type Role } from "@/lib/rbac";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  createdAt: string;
}

export default function RolesClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    switch (field) {
      case "roleName": setRoleName(value); break;
      case "userName": setUserName(value); break;
      case "userEmail": setUserEmail(value); break;
      case "userPhone": setUserPhone(value); break;
      case "userAddress": setUserAddress(value); break;
      case "userPassword": setUserPassword(value); break;
    }
  }

  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };



  // creates a new role with permissions and assigns it to a new user
  const handleCreateRole = async () => {
    const newErrors: Record<string, string> = {};
    if (!roleName.trim()) newErrors.roleName = "Role name is required";
    if (selectedPermissions.length === 0) newErrors.permissions = "Select at least one permission";
    if (!userName.trim()) newErrors.userName = "Name is required";
    if (!userEmail.trim()) newErrors.userEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) newErrors.userEmail = "Enter a valid email";
    if (!userPhone.trim()) newErrors.userPhone = "Phone is required";
    if (!userAddress.trim()) newErrors.userAddress = "Address is required";
    if (!userPassword) newErrors.userPassword = "Password is required";
    else if (userPassword.length < 6) newErrors.userPassword = "Password must be at least 6 characters";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    await createRoleWithPermissionsAction(roleName, selectedPermissions, {
      userName,
      userEmail,
      userPhone,
      userAddress,
      userPassword,
    });
    setRoleName("");
    setSelectedPermissions([]);
    setUserName("");
    setUserEmail("");
    setUserPhone("");
    setUserAddress("");
    setUserPassword("");
    setErrors({});
    setShowCreateRole(false);
    loadUsers();
    toast.success("Role & user created successfully");
  }

  // filters out customers — only management roles shown in the table
  const managementUsers = users.filter((u) => u.role !== "customer");

  const displayedUsers = searchQuery
    ? managementUsers.filter((u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : managementUsers;

  const totalPages = Math.ceil(displayedUsers.length / perPage);
  const start = (page - 1) * perPage;
  const visibleUsers = displayedUsers.slice(start, start + perPage);

  // colour-coded backgrounds and checkbox styles for each module in the permissions grid
  const moduleBgColors: Record<string, string> = {
    Dashboard: "bg-red-50 border-red-200",
    Orders: "bg-yellow-50 border-yellow-200",
    Menu: "bg-green-50 border-green-200",
    Customers: "bg-blue-50 border-blue-200",
    "Guest Users": "bg-teal-50 border-teal-200",
    Kitchen: "bg-purple-50 border-purple-200",
    Categories: "bg-cyan-50 border-cyan-200",
    Inventory: "bg-orange-50 border-orange-200",
    Suppliers: "bg-pink-50 border-pink-200",
    Payment: "bg-indigo-50 border-indigo-200",
    Support: "bg-rose-50 border-rose-200",
    Reports: "bg-gray-200 border-gray-300",
    Promotions: "bg-yellow-50 border-yellow-200",
    Settings: "bg-slate-50 border-slate-200",
    Roles: "bg-violet-50 border-violet-200",
    Messages: "bg-emerald-50 border-emerald-200",
    Accounting: "bg-lime-50 border-lime-200",
  };
  const moduleChechboxColors: Record<string, string> = {
    Dashboard: "bg-red-100 text-red-700",
    Orders: "bg-yellow-100 text-yellow-700",
    Menu: "bg-green-100 text-green-700",
    Customers: "bg-blue-100 text-blue-700",
    "Guest Users": "bg-teal-100 text-teal-700",
    Kitchen: "bg-purple-100 text-purple-700",
    Categories: "bg-cyan-100 text-cyan-700",
    Inventory: "bg-orange-100 text-orange-700",
    Suppliers: "bg-pink-100 text-pink-700",
    Payment: "bg-indigo-100 text-indigo-700",
    Support: "bg-rose-100 text-rose-700",
    Reports: "bg-gray-300 text-gray-700",
    Promotions: "bg-yellow-100 text-yellow-700",
    Settings: "bg-slate-100 text-slate-700",
    Roles: "bg-violet-100 text-violet-700",
    Messages: "bg-emerald-100 text-emerald-700",
    Accounting: "bg-lime-100 text-lime-700",
  };

  function openCreate() {
    setErrors({});
    setShowCreateRole(true);
  }

  function closeCreate() {
    setShowCreateRole(false);
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/superadmin/roles");
      const data = await res.json();
      if (!data.error) setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

      async function fetchUsers() {
        try {
          const res = await fetch("/api/superadmin/roles");
          const data = await res.json();
          if (!data.error && isActive) setUsers(data.users ?? []);
        } catch (err) {
          console.error(err);
        } finally {
          if (isActive) setLoading(false);
        }
      }

    fetchUsers();

    return () => {
      isActive = false;
    };
  }, []);

  // edit permissions modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);

  // loads current permissions of the selected user's role when edit modal opens
  useEffect(() => {
    if (!editUser || !editUser.roleId) return;
    getRolePermissionsAction(editUser.roleId)
      .then((perms) => {
        if (perms.length > 0) {
          setEditSelectedPermissions(perms);
        } else if (editUser.role && editUser.role in rolePermissions) {
          // DB has no permissions for this role — fall back to static/legacy RBAC
          const staticPerms = rolePermissions[editUser.role as Role] ?? [];
          setEditSelectedPermissions(staticPerms as string[]);
        }
      })
      .catch(console.error);
  }, [editUser]);

  // updates a user's role via PATCH API and refreshes the list
  async function updateRole(id: number, role: string) {
    setMessage("");
    try {
      const res = await fetch("/api/superadmin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setMessage(`User #${id} role updated to ${role}`);
      loadUsers();
    } catch {
      setMessage("Failed to update role");
    }
  }

  const roleColors: Record<string, string> = {
    "super-admin": "bg-red-200 text-red-700",
    "admin": "bg-purple-200 text-purple-700",
    "staff": "bg-blue-200 text-blue-700",
    "customer": "bg-green-200 text-green-700",
    "kitchen-manager": "bg-amber-200 text-amber-700",
    "payment-manager": "bg-cyan-200 text-cyan-700",
    "support-staff": "bg-slate-200 text-slate-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">Roles & Permissions</h1>

      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <input type="text" placeholder="Search by name or email..."
           value={searchQuery}
           onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-gray-300 px-4 sm:px-6 py-3 sm:py-4 text-sm outline-none focus:border-orange-500"
        />
        <div className="flex items-center flex-wrap gap-3 shrink-0">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
          {can("CREATE_ROLES") && (
          <button onClick={openCreate} className="rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600 cursor-pointer whitespace-nowrap">+ Add Roles</button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Current Role</th>
              <th className="p-4 text-left">Change Role</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found</td></tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`w-full rounded-full px-2 py-1 md:px-4 whitespace-nowrap  text-[12px] md:text-sm ${roleColors[user.role] ?? "bg-gray-200"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.role === "super-admin" ? (
                      <span className="text-sm text-gray-400 italic">Cannot change</span>
                    ) : can("UPDATE_ROLES") ? (
                      <select
                        key={`${user.id}-${user.role}`}
                        defaultValue={user.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          if (newRole !== user.role) {
                            const ok = await confirm({
                              title: "Confirm Role Change",
                              message: `Are you sure you want to change ${user.name}'s role from "${user.role}" to "${newRole}"?`,
                              confirmText: "Confirm",
                              variant: "warning",
                            });
                            if (ok) updateRole(user.id, newRole);
                          }
                        }}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        {![
                          "customer", "staff", "kitchen-manager",
                          "payment-manager", "support-staff", "admin", "super-admin"
                        ].includes(user.role) && (
                          <option value={user.role}>{user.role}</option>
                        )}
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="kitchen-manager">Kitchen Manager</option>
                        <option value="payment-manager">Payment Manager</option>
                        <option value="support-staff">Support Staff</option>
                        <option value="admin">Admin</option>
                        <option value="super-admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-sm ${roleColors[user.role] ?? "bg-gray-200 text-gray-700"}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      {can("UPDATE_ROLES") && (
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setEditSelectedPermissions([]);
                        }}
                        className="rounded text-blue-500 text-sm"
                      >
                        <Edit size={22} />
                      </button>
                      )}
                      {can("DELETE_ROLES") && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete User",
                            message: `Are you sure you want to delete ${user.name}?`,
                            confirmText: "Delete",
                            variant: "danger",
                          });
                          if (ok) {
                            await deleteUserAction(user.id);
                            loadUsers();
                            toast.success("User deleted");
                          }
                        }}
                        className="rounded text-red-500 text-sm"
                      >
                        <Trash2 size={22} />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({displayedUsers.length} users)
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



      {/* modal: create a new role with permissions and assign it to a new user */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-2 px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Create New Role</h2>

              <button
                onClick={closeCreate}
                className="rounded-md p-2 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="mt-6 space-y-6">
              {/* Role Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Role Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter role name"
                  value={roleName}
                  onChange={(e) => updateField("roleName", e.target.value)}
                  className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.roleName ? "border-red-500" : ""}`}
                />
                {errors.roleName && <p className="mt-1 text-sm text-red-500">{errors.roleName}</p>}
              </div>

              {/* Permissions */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Permissions
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                    {([
                    ["Dashboard", "DASHBOARD"],
                    ["Customers", "USERS"],
                    ["Guest Users", "GUEST_USERS"],
                    ["Kitchen", "KITCHENS"],
                    ["Orders", "ORDERS"],
                    ["Menu", "MENUS"],
                    ["Categories", "CATEGORIES"],
                    ["Inventory", "INVENTORY"],
                    ["Suppliers", "SUPPLIERS"],
                    ["Payment", "PAYMENTS"],
                    ["Support", "SUPPORTS"],
                    ["Reports", "REPORTS"],
                    ["Promotions", "PROMOTIONS"],
                    ["Settings", "SETTINGS"],
                    ["Roles", "ROLES"],
                    ["Messages", "MESSAGES"],
                    ["Accounting", "ACCOUNTING"],
                  ] as [string, string][]).map(([module, dbModule]) => (
                    <div
                      key={module}
                      className={`rounded-xl border p-4 ${moduleBgColors[module]}`}
                    >
                      <h4 className="mb-3 font-semibold">
                        {module}
                      </h4>

                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ["View", "VIEW"],
                          ["Add", "CREATE"],
                          ["Update", "UPDATE"],
                          ["Delete", "DELETE"],
                          ["Export", "DOWNLOAD"],
                        ] as [string, string][]).map(([label, permPrefix]) => (
                          <label
                            key={label}
                            className={`rounded-full p-3 flex items-center gap-2 text-sm ${moduleChechboxColors[module]}`}
                          >
                             <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={selectedPermissions.includes(`${permPrefix}_${dbModule}`)}
                              onChange={(e) => {
                                const permName = `${permPrefix}_${dbModule}`
                                if (e.target.checked) {
                                  setSelectedPermissions((prev) => [...prev, permName]);
                                } else {
                                  setSelectedPermissions((prev) => prev.filter((p) => p !== permName));
                                }
                              }}
                            />
                            {label}
                          </label>

                        ))}
                        {module === "Menu" && (
                          <label className="rounded-full p-3 flex items-center gap-2 text-sm bg-green-100 text-green-700">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={selectedPermissions.includes("VIEW_RECIPES")}
                              onChange={(e) => {
                                const permName = "VIEW_RECIPES";
                                if (e.target.checked) {
                                  setSelectedPermissions((prev) => [...prev, permName]);
                                } else {
                                  setSelectedPermissions((prev) => prev.filter((p) => p !== permName));
                                }
                              }}
                            />
                            View Recipe
                          </label>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
                {errors.permissions && <p className="mt-1 text-sm text-red-500">{errors.permissions}</p>}
              </div>

              {/* User Details */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold">Assign to User</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Enter user name"
                      value={userName} onChange={(e) => updateField("userName", e.target.value)}
                      className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.userName ? "border-red-500" : ""}`} />
                    {errors.userName && <p className="mt-1 text-sm text-red-500">{errors.userName}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email <span className="text-red-500">*</span></label>
                    <input type="email" placeholder="Enter email"
                      value={userEmail} onChange={(e) => updateField("userEmail", e.target.value)}
                      className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.userEmail ? "border-red-500" : ""}`} />
                    {errors.userEmail && <p className="mt-1 text-sm text-red-500">{errors.userEmail}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Enter phone number"
                      value={userPhone} onChange={(e) => updateField("userPhone", e.target.value)}
                      className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.userPhone ? "border-red-500" : ""}`} />
                    {errors.userPhone && <p className="mt-1 text-sm text-red-500">{errors.userPhone}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Enter address"
                      value={userAddress} onChange={(e) => updateField("userAddress", e.target.value)}
                      className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.userAddress ? "border-red-500" : ""}`} />
                    {errors.userAddress && <p className="mt-1 text-sm text-red-500">{errors.userAddress}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Password <span className="text-red-500">*</span></label>
                    <input type="password" placeholder="Set password"
                      value={userPassword} onChange={(e) => updateField("userPassword", e.target.value)}
                      className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${errors.userPassword ? "border-red-500" : ""}`} />
                    {errors.userPassword && <p className="mt-1 text-sm text-red-500">{errors.userPassword}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4">
              <button onClick={closeCreate} className="rounded-lg border px-4 py-2">
                Cancel
              </button>

              <button onClick={handleCreateRole} className="rounded-lg bg-orange-500 px-4 py-2 text-white" >
                Create Role & User
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* modal: edit permissions for the role assigned to the selected user */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-2 px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl my-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Edit Permissions — {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} className="rounded-md p-2 hover:bg-gray-200">✕</button>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Permissions for role: {editUser.role}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {([
                    ["Dashboard", "DASHBOARD"],
                    ["Customers", "USERS"],
                    ["Guest Users", "GUEST_USERS"],
                    ["Kitchen", "KITCHENS"],
                    ["Orders", "ORDERS"],
                    ["Menu", "MENUS"],
                    ["Categories", "CATEGORIES"],
                    ["Inventory", "INVENTORY"],
                    ["Suppliers", "SUPPLIERS"],
                    ["Payment", "PAYMENTS"],
                    ["Support", "SUPPORTS"],
                    ["Reports", "REPORTS"],
                    ["Promotions", "PROMOTIONS"],
                    ["Settings", "SETTINGS"],
                    ["Roles", "ROLES"],
                    ["Messages", "MESSAGES"],
                    ["Accounting", "ACCOUNTING"],
                  ] as [string, string][]).map(([module, dbModule]) => (
                    <div key={module} className={`rounded-xl border p-4 ${moduleBgColors[module]}`}>
                      <h4 className="mb-3 font-semibold">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ["View", "VIEW"],
                          ["Add", "CREATE"],
                          ["Update", "UPDATE"],
                          ["Delete", "DELETE"],
                          ["Export", "DOWNLOAD"],
                        ] as [string, string][]).map(([label, permPrefix]) => {
                          const permName = `${permPrefix}_${dbModule}`;
                          return (
                            <label key={label} className={`rounded-full p-3 flex items-center gap-2 text-sm ${moduleChechboxColors[module]}`}>
                              <input
                                type="checkbox"
                                className="accent-orange-500"
                                checked={editSelectedPermissions.includes(permName)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditSelectedPermissions((prev) => [...prev, permName]);
                                  } else {
                                    setEditSelectedPermissions((prev) => prev.filter((p) => p !== permName));
                                  }
                                }}
                              />
                              {label}
                            </label>
                          );
                        })}
                        {module === "Menu" && (
                          <label className="rounded-full p-3 flex items-center gap-2 text-sm bg-green-100 text-green-700">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={editSelectedPermissions.includes("VIEW_RECIPES")}
                              onChange={(e) => {
                                const permName = "VIEW_RECIPES";
                                if (e.target.checked) {
                                  setEditSelectedPermissions((prev) => [...prev, permName]);
                                } else {
                                  setEditSelectedPermissions((prev) => prev.filter((p) => p !== permName));
                                }
                              }}
                            />
                            View Recipe
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4">
              <button onClick={() => { setEditUser(null); setEditSelectedPermissions([]); }} className="rounded-lg border px-4 py-2">Cancel</button>
              <button
                onClick={async () => {
                  if (!editUser.roleId) return;
                  await updateRolePermissionsAction(editUser.roleId, editSelectedPermissions);
                  setEditUser(null);
                  setEditSelectedPermissions([]);
                  toast.success("Permissions updated");
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-bold mb-4">Role Descriptions</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong className="text-red-600">Super Admin:</strong> Full system access, can manage all aspects including roles, settings, and all modules.</p>
          <p><strong className="text-purple-600">Admin:</strong> Can manage orders, menu, categories, inventory, kitchens, and support tickets.</p>
          <p><strong className="text-blue-600">Staff:</strong> Can view and update orders, manage support tickets.</p>
          <p><strong className="text-green-600">Customer:</strong> Regular user who can browse menu, place orders, and view their own dashboard.</p>
          <p><strong className="text-amber-600">Kitchen Manager:</strong> Can manage menu, orders, inventory, categories, settings, and promotions.</p>
          <p><strong className="text-cyan-600">Payment Manager:</strong> Can view reports and payments, manage payments.</p>
          <p><strong className="text-slate-600">Support Staff:</strong> Can view reports and payments.</p>
        </div>
      </div>
    </div>
  );
}