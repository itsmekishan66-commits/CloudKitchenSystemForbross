"use client";
import { Edit, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  createRoleAction, 
  updateRolePermissionsAction, 
  getRolePermissionsAction,
  deleteRoleAction
} from "@/app/(superadmin)/_action/roles";
import { useConfirm } from "@/app/_components/ConfirmPopup";
import toast from "react-hot-toast";
import { usePermissions } from "@/lib/permission-context";
import { rolePermissions, type Role } from "@/lib/rbac";
import Pagination from "@/app/_components/Pagination";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  createdAt: string;
  lastLogin: string | null;
}

interface RoleData {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
}

// System roles that cannot be edited or deleted
const SYSTEM_ROLES = new Set([
  "super-admin",
  "admin",
  "staff",
  "customer",
  "kitchen-manager",
  "payment-manager",
  "support-staff",
]);

// Role descriptions
const ROLE_DESCRIPTIONS: Record<string, string> = {
  "super-admin": "Full system access, can manage all aspects including roles, settings, and all modules.",
  "admin": "Can manage orders, menu, categories, inventory, kitchens, and support tickets.",
  "staff": "Can view and update orders, manage support tickets.",
  "customer": "Regular user who can browse menu, place orders, and view their own dashboard.",
  "kitchen-manager": "Can manage menu, orders, inventory, categories, settings, and promotions.",
  "payment-manager": "Can view reports and payments, manage payments.",
  "support-staff": "Can view and manage support tickets.",
};

// Color-coded role badges
const roleColors: Record<string, string> = {
  "super-admin": "bg-red-200 text-red-700",
  "admin": "bg-purple-200 text-purple-700",
  "staff": "bg-blue-200 text-blue-700",
  "customer": "bg-green-200 text-green-700",
  "kitchen-manager": "bg-amber-200 text-amber-700",
  "payment-manager": "bg-cyan-200 text-cyan-700",
  "support-staff": "bg-slate-200 text-slate-700",
};

// Module definitions for permissions grid
const MODULES: [string, string][] = [
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
];

const ACTIONS: [string, string][] = [
  ["View", "VIEW"],
  ["Add", "CREATE"],
  ["Update", "UPDATE"],
  ["Delete", "DELETE"],
  ["Export", "DOWNLOAD"],
];

// Color-coded backgrounds and checkbox styles for each module
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

const moduleCheckboxColors: Record<string, string> = {
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

export default function RolesClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Users table pagination
  const [userPage, setUserPage] = useState(1);
  const userPerPage = 20;

  // Create role modal
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit role modal
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");

  // Load users
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
    return () => { isActive = false; };
  }, []);

  // Load roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/superadmin/roles/list");
        const data = await res.json();
        if (!data.error) setRoles(data.roles ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchRoles();
  }, []);

  // Load permissions when editing a role
  useEffect(() => {
    if (!editingRole) return;
    getRolePermissionsAction(editingRole.id)
      .then((perms) => {
        if (perms.length > 0) {
          setEditSelectedPermissions(perms);
        } else if (editingRole.name && editingRole.name in rolePermissions) {
          const staticPerms = rolePermissions[editingRole.name as Role] ?? [];
          setEditSelectedPermissions(staticPerms as string[]);
        }
        setEditRoleName(editingRole.name);
        setEditRoleDescription(editingRole.description || "");
      })
      .catch(console.error);
  }, [editingRole]);

  const displayedUsers = searchQuery
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const userTotalPages = Math.ceil(displayedUsers.length / userPerPage);
  const userStart = (userPage - 1) * userPerPage;
  const visibleUsers = displayedUsers.slice(userStart, userStart + userPerPage);

  function openCreateRole() {
    setCreateErrors({});
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setShowCreateRole(true);
  }

  function closeCreateRole() {
    setShowCreateRole(false);
  }

  function openEditRole(role: RoleData) {
    setEditingRole(role);
  }

  function closeEditRole() {
    setEditingRole(null);
    setEditSelectedPermissions([]);
  }

  async function handleCreateRole() {
    const newErrors: Record<string, string> = {};
    if (!roleName.trim()) newErrors.roleName = "Role name is required";
    if (selectedPermissions.length === 0) newErrors.permissions = "Select at least one permission";
    
    if (Object.keys(newErrors).length > 0) {
      setCreateErrors(newErrors);
      return;
    }

    try {
      await createRoleAction(roleName.trim(), selectedPermissions, roleDescription.trim() || undefined);
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissions([]);
      setCreateErrors({});
      setShowCreateRole(false);
      toast.success("Role created successfully");
      // Refresh roles list
      const res = await fetch("/api/superadmin/roles/list");
      const data = await res.json();
      if (!data.error) setRoles(data.roles ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create role");
    }
  }

  async function handleSavePermissions() {
    if (!editingRole) return;
    try {
      await updateRolePermissionsAction(editingRole.id, editSelectedPermissions);
      toast.success("Permissions updated");
      closeEditRole();
      // Refresh roles list
      const res = await fetch("/api/superadmin/roles/list");
      const data = await res.json();
      if (!data.error) setRoles(data.roles ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update permissions");
    }
  }

  async function handleDeleteRole(role: RoleData) {
    const ok = await confirm({
      title: "Delete Role",
      message: `Are you sure you want to delete the role "${role.name}"? This cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await deleteRoleAction(role.id);
        toast.success("Role deleted");
        const res = await fetch("/api/superadmin/roles/list");
        const data = await res.json();
        if (!data.error) setRoles(data.roles ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete role");
      }
    }
  }

  function togglePermission(permName: string, isEdit: boolean = false) {
    if (isEdit) {
      setEditSelectedPermissions((prev) =>
        prev.includes(permName)
          ? prev.filter((p) => p !== permName)
          : [...prev, permName]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(permName)
          ? prev.filter((p) => p !== permName)
          : [...prev, permName]
      );
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
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">Roles & Permissions</h1>

      {/* Header & Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }}
          className="w-full rounded-lg border border-gray-300 px-4 sm:px-6 py-3 sm:py-4 text-sm outline-none focus:border-orange-500"
        />
        {can("CREATE_ROLES") && (
          <button
            onClick={openCreateRole}
            className="rounded-xl bg-orange-500 px-4 sm:px-6 py-3 sm:py-4 text-white font-semibold hover:bg-orange-600 whitespace-nowrap flex items-center gap-2"
          >
            <Plus size={20} />
            Add Role
          </button>
        )}
      </div>

      {/* Section 1: Assigned Roles & Their Details — Users Table */}
      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Assigned Roles & Their Details</h2>
          <p className="text-sm text-gray-500">Users with their current role assignments</p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Current Role</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">No users found</td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleColors[user.role] ?? "bg-gray-200 text-gray-700"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.lastLogin ? (
                      <span className="text-sm text-gray-600">
                        {new Date(user.lastLogin).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Never</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {userTotalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
            <Pagination
              total={displayedUsers.length}
              perPage={userPerPage}
              page={userPage}
              onPage={setUserPage}
              label="Users"
            />
          </div>
        )}
      </div>

      {/* Section 2: Roles Available — Roles Table */}
      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Roles Available</h2>
          <p className="text-sm text-gray-500">Manage role permissions and descriptions</p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="p-4 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-400">No roles found</td>
              </tr>
            ) : (
              roles.map((role) => {
                const isSystemRole = SYSTEM_ROLES.has(role.name);
                const description = ROLE_DESCRIPTIONS[role.name] || role.description || "—";
                
                return (
                  <tr key={role.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleColors[role.name] ?? "bg-gray-200 text-gray-700"}`}>
                        {role.name}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 max-w-md truncate">{description}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {isSystemRole ? (
                          <span className="text-xs text-gray-400 italic">System role</span>
                        ) : (
                          <>
                            {can("UPDATE_ROLES") && (
                              <button
                                onClick={() => openEditRole(role)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit permissions"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("DELETE_ROLES") && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete role"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create New Role */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-4 px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Create New Role</h2>
              <button onClick={closeCreateRole} className="rounded-md p-2 hover:bg-gray-200">✕</button>
            </div>

            {/* Body */}
            <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Role Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter role name (e.g., 'manager')"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className={`w-full rounded-lg border p-3 outline-none focus:border-orange-500 ${createErrors.roleName ? "border-red-500" : ""}`}
                />
                {createErrors.roleName && <p className="mt-1 text-sm text-red-500">{createErrors.roleName}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe what this role does..."
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>

              {/* Permissions Grid */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">Permissions</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {MODULES.map(([module, dbModule]) => (
                    <div
                      key={module}
                      className={`rounded-xl border p-4 ${moduleBgColors[module]}`}
                    >
                      <h4 className="mb-3 font-semibold">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIONS.map(([label, permPrefix]) => {
                          const permName = `${permPrefix}_${dbModule}`;
                          return (
                            <label
                              key={label}
                              className={`rounded-full p-2 flex items-center gap-2 text-xs ${moduleCheckboxColors[module]}`}
                            >
                              <input
                                type="checkbox"
                                className="accent-orange-500"
                                checked={selectedPermissions.includes(permName)}
                                onChange={() => togglePermission(permName)}
                              />
                              {label}
                            </label>
                          );
                        })}
                        {module === "Menu" && (
                          <label className="rounded-full p-2 flex items-center gap-2 text-xs bg-green-100 text-green-700">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={selectedPermissions.includes("VIEW_RECIPES")}
                              onChange={() => togglePermission("VIEW_RECIPES")}
                            />
                            View Recipe
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {createErrors.permissions && <p className="mt-2 text-sm text-red-500">{createErrors.permissions}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4">
              <button onClick={closeCreateRole} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="rounded-lg bg-orange-500 px-4 py-2 text-white font-medium hover:bg-orange-600"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Permissions */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-auto pt-4 px-4">
          <div className="w-full max-w-[95vw] sm:max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">Edit Permissions — {editingRole.name}</h2>
              <button onClick={closeEditRole} className="rounded-md p-2 hover:bg-gray-200">✕</button>
            </div>

            {/* Body */}
            <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Role Name (read-only for now) */}
              <div>
                <label className="mb-2 block text-sm font-medium">Role Name</label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-500 bg-gray-50"
                  disabled={SYSTEM_ROLES.has(editingRole.name)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-500"
                  rows={2}
                  disabled={SYSTEM_ROLES.has(editingRole.name)}
                />
              </div>

              {/* Permissions Grid */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">Permissions</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {MODULES.map(([module, dbModule]) => (
                    <div
                      key={module}
                      className={`rounded-xl border p-4 ${moduleBgColors[module]}`}
                    >
                      <h4 className="mb-3 font-semibold">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIONS.map(([label, permPrefix]) => {
                          const permName = `${permPrefix}_${dbModule}`;
                          return (
                            <label
                              key={label}
                              className={`rounded-full p-2 flex items-center gap-2 text-xs ${moduleCheckboxColors[module]}`}
                            >
                              <input
                                type="checkbox"
                                className="accent-orange-500"
                                checked={editSelectedPermissions.includes(permName)}
                                onChange={() => togglePermission(permName, true)}
                                disabled={SYSTEM_ROLES.has(editingRole.name)}
                              />
                              {label}
                            </label>
                          );
                        })}
                        {module === "Menu" && (
                          <label className="rounded-full p-2 flex items-center gap-2 text-xs bg-green-100 text-green-700">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={editSelectedPermissions.includes("VIEW_RECIPES")}
                              onChange={() => togglePermission("VIEW_RECIPES", true)}
                              disabled={SYSTEM_ROLES.has(editingRole.name)}
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

            {/* Footer */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4">
              <button onClick={closeEditRole} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
                Cancel
              </button>
              {!SYSTEM_ROLES.has(editingRole.name) && (
                <button
                  onClick={handleSavePermissions}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-white font-medium hover:bg-orange-600"
                >
                  Save Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}