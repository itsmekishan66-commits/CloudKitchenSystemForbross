"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { createRoleWithPermissionsAction , deleteUserAction, getRolePermissionsAction, updateRolePermissionsAction} from "@/app/(superadmin)/_action/roles";
//static code for RBAc gareko bela ko ho
// import { createRoleWithPermissionsAction, updateRolePermissionsAction, deleteUserAction, getRolePermissionsAction } from "@/app/(superadmin)/_action/roles";

import toast from "react-hot-toast";
import { usePermissions } from "@/lib/permission-context";

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
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userPassword, setUserPassword] = useState("");
  
  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };



  // creates a new role with permissions and assigns it to a new user
  const handleCreateRole = async () => {
    if (!roleName || !userName) return;
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
    setShowCreateRole(false);
    loadUsers();
    toast.success("Role & user created successfully");
  }

  // filters out customers — only management roles shown in the table
  const managementUsers = users.filter((u) => u.role !== "customer");

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
    Payment: "bg-indigo-50 border-indigo-200",
    Support: "bg-rose-50 border-rose-200",
    Reports: "bg-gray-200 border-gray-300",
    Promotions: "bg-yellow-50 border-yellow-200",
    Settings: "bg-slate-50 border-slate-200",
    Roles: "bg-violet-50 border-violet-200",
    Messages: "bg-emerald-50 border-emerald-200",
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
    Payment: "bg-indigo-100 text-indigo-700",
    Support: "bg-rose-100 text-rose-700",
    Reports: "bg-gray-300 text-gray-700",
    Promotions: "bg-yellow-100 text-yellow-700",
    Settings: "bg-slate-100 text-slate-700",
    Roles: "bg-violet-100 text-violet-700",
    Messages: "bg-emerald-100 text-emerald-700",
  };

  function openCreate() {
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

  // confirm dialog state for changing a user's role
  const [confirm, setConfirm] = useState<{ user: User; role: string } | null>(null);
  // edit permissions modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);
  // delete user confirmation state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // loads current permissions of the selected user's role when edit modal opens
  useEffect(() => {
    if (!editUser || !editUser.roleId) return;
    getRolePermissionsAction(editUser.roleId).then(setEditSelectedPermissions).catch(console.error);
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
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Roles & Permissions</h1>

      <div className="mb-4 flex items-center justify-between gap-4">
        <input type="text" placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-6 py-4 text-sm outline-none focus:border-orange-500"
        />
        <div className="flex items-center justify-end gap-4">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
          {can("CREATE_ROLES") && (
          <button onClick={openCreate} className="rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600 cursor-pointer whitespace-nowrap">+ Add Roles</button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="rounded-xl bg-white shadow overflow-hidden">
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
            {(searchQuery
              ? managementUsers.filter((u) =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              : managementUsers
            ).length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found</td></tr>
            ) : (
              (searchQuery
                ? managementUsers.filter((u) =>
                  u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                : managementUsers
              ).map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${roleColors[user.role] ?? "bg-gray-200"}`}>
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
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== user.role) {
                            setConfirm({ user, role: newRole });
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
                    <div className="flex gap-2">
                      {can("UPDATE_ROLES") && (
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setEditSelectedPermissions([]);
                        }}
                        className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      )}
                      {can("DELETE_ROLES") && (
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
                      >
                        Delete
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



      {/* modal: create a new role with permissions and assign it to a new user */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-2">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
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
                  Role Name
                </label>

                <input
                  type="text"
                  placeholder="Enter role name"
                  // for the rbac imlementation
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-500"
                />
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
                    ["Payment", "PAYMENTS"],
                    ["Support", "SUPPORTS"],
                    ["Reports", "REPORTS"],
                    ["Promotions", "PROMOTIONS"],
                    ["Settings", "SETTINGS"],
                    ["Roles", "ROLES"],
                    ["Messages", "MESSAGES"],
                    ["Staff", "STAFF"],
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
                              className="h-4 w-4"
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
                        {/* just to check or test ko lagi hai */}
                        {/* <div className="mt-4 text-xs text-gray-500">{JSON.stringify(selectedPermissions)}</div> */}

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Details */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold">Assign to User</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Name *</label>
                    <input type="text" placeholder="Enter user name"
                      value={userName} onChange={(e) => setUserName(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email</label>
                    <input type="email" placeholder="Enter email"
                      value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone</label>
                    <input type="text" placeholder="Enter phone number"
                      value={userPhone} onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address</label>
                    <input type="text" placeholder="Enter address"
                      value={userAddress} onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Password</label>
                    <input type="password" placeholder="Set password"
                      value={userPassword} onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-2">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
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
                    ["Payment", "PAYMENTS"],
                    ["Support", "SUPPORTS"],
                    ["Reports", "REPORTS"],
                    ["Promotions", "PROMOTIONS"],
                    ["Settings", "SETTINGS"],
                    ["Roles", "ROLES"],
                    ["Messages", "MESSAGES"],
                    ["Staff", "STAFF"],
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
                                className="h-4 w-4"
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => { setEditUser(null); setEditSelectedPermissions([]); }} className="rounded-lg border px-4 py-2">Cancel</button>
              <button
                onClick={async () => {
                  if (!editUser.roleId) return;
                  await updateRolePermissionsAction(editUser.roleId, editSelectedPermissions);
                  setEditUser(null);
                  setEditSelectedPermissions([]);
                  toast.success("Permissions updated");
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Role Change</h2>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to change <strong>{confirm.user.name}</strong>&apos;s role?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-medium">{confirm.user.role}</span>
              &nbsp;&rarr;&nbsp;
              <span className="inline-block rounded bg-orange-200 px-2 py-0.5 text-xs font-medium">{confirm.role}</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateRole(confirm.user.id, confirm.role);
                  setConfirm(null);
                }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal: confirm delete user */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-2">Delete User</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={async () => {
                  await deleteUserAction(deleteTarget.id);
                  setDeleteTarget(null);
                  loadUsers();
                  toast.success("User deleted");
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
              >
                Delete
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