# RBAC (Role-Based Access Control) — Complete Guide

> **Target audience:** First-year college student  
> **Project:** Cloud Kitchen Management System

---

## 1. What is RBAC? (Plain English)

Imagine your school has different types of people:
- **Principal** — can do everything (see all files, change rules, fire teachers)
- **Teacher** — can take classes, give marks, see student records
- **Student** — can only see their own marks and attendance
- **Guard** — can only check IDs at the gate

RBAC is exactly this system but for software. Instead of giving permissions to each person individually (which is a nightmare), you:

1. Create **Roles** (like "Admin", "Staff", "Kitchen Manager")
2. Assign **Permissions** to each Role (like "View Orders", "Delete Users")
3. Assign a **Role** to each User

Now when a user tries to do something — like delete an order — the system checks:

```
Does the user's role have the "DELETE_ORDERS" permission?
    → Yes → Allow the action
    → No  → Block it (show "Unauthorized")
```

---

## 2. The Big Picture — How Data Flows

```
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
│                                                              │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │  users   │───→│      roles       │───→│ permissions  │   │
│  │          │    │                  │    │              │   │
│  │ user1    │    │ super-admin      │    │ VIEW_USERS   │   │
│  │ user2    │    │ admin            │    │ CREATE_USERS │   │
│  │ user3    │    │ staff            │    │ DELETE_ORDERS│   │
│  └────┬─────┘    │ kitchen-manager  │    │ ...          │   │
│       │          └────────┬─────────┘    └──────┬───────┘   │
│       │roleId             │roleId               │permId      │
│       │                   │                     │            │
│       └───────────────────┼─────────────────────┘            │
│                           │                                  │
│                  ┌────────┴──────────┐                       │
│                  │  role_permissions  │  (join table)        │
│                  │                   │                       │
│                  │ roleId | permId   │                       │
│                  │   1    |   1      │                       │
│                  │   1    |   2      │                       │
│                  └───────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
         ▲                                            │
         │                                            │
         │          ┌──────────────────┐               │
         │          │   Server checks   │              │
         │          │  permissions via  │              │
         │          │  getUserPermissions()           │
         │          └──────────────────┘               │
         │                                            ▼
  ┌─────────────┐                         ┌──────────────────┐
  │  Login Page │                         │   Page / Button   │
  │  (auth)     │                         │   (render or      │
  │             │                         │    hide based     │
  │  User signs │                         │    on permission) │
  │  in → gets  │                         │                  │
  │  session    │                         │  "Edit" button   │
  └─────────────┘                         │  only shown if   │
                                          │  user has        │
                                          │  UPDATE_ORDERS   │
                                          └──────────────────┘
```

---

## 3. The Database Tables (How Data is Stored)

We have **4 database tables** that make RBAC work:

### Table 1: `permissions`
Stores all possible actions in the system.

| Column      | Example Values                |
|-------------|-------------------------------|
| id          | 1, 2, 3                      |
| name        | `VIEW_USERS`, `DELETE_ORDERS` |
| description | "Can view user list"          |

**File:** `db/schemas/permissions.ts`

### Table 2: `roles`
Stores job titles / roles.

| Column | Example Values         |
|--------|------------------------|
| id     | 1, 2, 3               |
| name   | `super-admin`, `staff` |

**File:** `db/schemas/roles.ts`

### Table 3: `role_permissions` (THE KEY TABLE)
This is a **join table** — it connects roles to permissions (many-to-many).

| Column        | Example |
|---------------|---------|
| role_id       | 1       |
| permission_id | 5       |

Meaning: Role #1 (super-admin) has Permission #5 (DELETE_ORDERS).

**File:** `db/schemas/rolePermissions.ts`

### Table 4: `users`
Each user has a `roleId` that points to their role.

| Column | Example              |
|--------|----------------------|
| id     | 1                    |
| name   | "John"               |
| roleId | 1 (→ super-admin)    |

**File:** `db/schemas/users.ts`

---

## 4. The Folder Structure — Where is the RBAC Code?

```
┌─── lib/                          ← Utility functions
│   ├── permissions.ts             ← List of all permission names (like an enum)
│   ├── roles.ts                   ← List of all role names (like an enum)
│   ├── rbac.ts                    ← OLD static permission checker
│   ├── getUserPermissions.ts      ← NEW: fetches permissions from DB
│   ├── requirePermission.ts       ← Guards pages (server-side)
│   ├── apiRequirePermissions.ts   ← Guards API routes (server-side)
│   ├── permission-context.tsx     ← Client-side: makes permissions available to React components
│   └── auth.ts                    ← Gets current logged-in user
│
├─── db/
│   ├── schemas/
│   │   ├── permissions.ts         ← DB table definition
│   │   ├── roles.ts               ← DB table definition
│   │   ├── rolePermissions.ts     ← DB table definition
│   │   └── users.ts               ← DB table definition
│   ├── services/
│   │   ├── permissions.ts         ← Functions to read/write permissions in DB
│   │   └── roles.ts               ← Functions to read/write roles in DB
│   └── seed/
│       └── role-permissions.ts    ← Script to fill DB with initial roles & permissions
│
└─── app/(superadmin)/             ← Admin panel pages
    ├── layout.tsx                 ← Wraps all pages with permission provider
    ├── dashboard/page.tsx         ← Checks VIEW_DASHBOARD permission
    ├── dashboard/roles/
    │   ├── page.tsx               ← Checks VIEW_ROLES permission
    │   └── client.tsx             ← UI for creating/editing roles & permissions
    └── _components/Sidebar.tsx    ← Sidebar that hides menu items based on permissions
```

---

## 5. The Two Systems: Old Static RBAC vs New Dynamic RBAC

This project has **two RBAC systems** running side by side. The new one is better.

### ❌ Old System (Static) — `lib/rbac.ts`

```typescript
// It has a hardcoded map like this:
const rolePermissions = {
  "super-admin": ["VIEW_USERS", "DELETE_USERS", ...],
  "staff":       ["VIEW_ORDERS", ...],
};
```

**Problem:** If you want to give "Staff" a new permission, you have to edit code and redeploy. You can't do it from the admin panel.

### ✅ New System (Dynamic) — DB-based

Permissions are stored in the **database**. You can change them anytime from the Roles & Permissions page in the admin panel. No coding needed.

### How they work together:

```typescript
// In requirePermission.ts:
const userPermissions = await getUserPermissions(user.id);

// If user has DB permissions → use those
if (userPermissions.length > 0) {
  allowed = userPermissions.includes(permission);
}
// Otherwise → fall back to old static system
else {
  allowed = hasPermission(user.role, permission);
}
```

This means: if your DB has permissions stored, the system uses those. If not (maybe you just installed), it falls back to the hardcoded static map so things don't break.

---

## 6. Permission Naming Convention

Every permission has this pattern:

```
{ACTION}_{MODULE}
```

### Actions:
| Label in UI | Actual Permission Prefix |
|-------------|-------------------------|
| View        | `VIEW_`                 |
| Add         | `CREATE_`               |
| Update      | `UPDATE_`               |
| Delete      | `DELETE_`               |
| Export      | `DOWNLOAD_`             |

### Modules:
`USERS`, `GUEST_USERS`, `DASHBOARD`, `KITCHENS`, `MENUS`, `ORDERS`, `REPORTS`, `PAYMENTS`, `INVENTORY`, `CATEGORIES`, `SETTINGS`, `PROMOTIONS`, `SUPPORTS`, `ROLES`, `MESSAGES`

### Example full permission names:
- `VIEW_USERS` — Can see the Users page
- `CREATE_ORDERS` — Can create new orders
- `DELETE_PROMOTIONS` — Can delete promotions
- `DOWNLOAD_REPORTS` — Can export reports to PDF/CSV/Excel

---

## 7. How Permissions are Checked (3 Levels)

### Level 1: Page Access (Server-side)

When you visit a page, the **server** checks if you're allowed before even showing it.

**File:** `lib/requirePermission.ts`

```typescript
// Example: orders/page.tsx
export default async function OrdersPage() {
  const user = await requirePermission("VIEW_ORDERS");
  // If user doesn't have VIEW_ORDERS → redirects to /unauthorized
  // If user has it → continues to render the page
  return <OrdersClient />;
}
```

### Level 2: API Calls (Server-side)

When the frontend makes a fetch call to an API, the **API route** checks permission again.

**File:** `lib/apiRequirePermissions.ts`

```typescript
// Example: api/superadmin/roles/route.ts
export async function PATCH(request) {
  const user = await apiRequirePermissions("UPDATE_ROLES");
  // If not allowed → returns 403 Forbidden
  // If allowed → continues
  // ... update role logic ...
}
```

### Level 3: Buttons & UI Elements (Client-side)

On the React frontend, buttons are **hidden** if the user doesn't have permission.

**File:** `lib/permission-context.tsx` (the provider)

**How it flows:**

```
Step 1: Layout fetches user's permissions from DB
        userPermissions = ["VIEW_USERS", "CREATE_USERS", "UPDATE_USERS", ...]

Step 2: Layout wraps all pages with <PermissionsProvider>
        <PermissionsProvider permissions={userPermissions}>
            {children}
        </PermissionsProvider>

Step 3: Any client component can use the hook:
        const permissions = usePermissions();
        const can = (p) => permissions.includes(p);

Step 4: Gate buttons:
        {can("CREATE_USERS") && <button>+ Add User</button>}
        {can("DELETE_USERS") && <button>Delete</button>}
        {can("DOWNLOAD_USERS") && <ExportButton />}
```

---

## 8. The Complete Request Flow (Step by Step)

Let's trace what happens when a **Kitchen Manager** tries to visit the Orders page:

```
1. USER LOGS IN
   └→ Session created (they are now "logged in")
   
2. USER VISITS /dashboard/orders
   └→ Server runs requirePermission("VIEW_ORDERS")
       └→ getCurrentUser() → finds the user session
       └→ getUserPermissions(user.id) → runs SQL:
            SELECT permissions.name
            FROM users
            JOIN roles ON users.roleId = roles.id
            JOIN role_permissions ON roles.id = role_permissions.roleId
            JOIN permissions ON role_permissions.permissionId = permissions.id
            WHERE users.id = 5
       └→ Returns: ["VIEW_DASHBOARD", "VIEW_MENUS", "VIEW_ORDERS", "UPDATE_ORDERS", ...]
       └→ Checks: Does ["VIEW_ORDERS"] include "VIEW_ORDERS"?
            → YES → Continue
            → NO  → Redirect to /unauthorized

3. PAGE RENDERS
   └→ Layout also calls getUserPermissions() and passes to PermissionsProvider
   └→ OrdersTable component calls usePermissions()
       └→ can("UPDATE_ORDERS") → true → shows status dropdown
       └→ can("DELETE_ORDERS") → false → hides delete button

4. USER CHANGES ORDER STATUS
   └→ Frontend sends PATCH /api/orders
   └→ Server runs apiRequirePermissions("UPDATE_ORDERS")
       └→ Same permission check as step 2
       └→ If allowed → updates the order
       └→ If not allowed → returns 403 error
```

---

## 9. Creating/Managing Roles (The UI)

The **Roles & Permissions** page at `/dashboard/roles` is where admins manage everything.

### Creating a new Role:
1. Click **"+ Add Roles"**
2. Enter a **Role Name**
3. Check the permissions you want (View, Add, Update, Delete, Export per module)
4. Assign it to a user
5. Click **"Create Role & User"**

### Editing a Role's Permissions:
1. Find the user in the table
2. Click **"Edit"**
3. The permission checkboxes load with the current permissions checked
4. Check/uncheck permissions
5. Click **"Save Permissions"**

---

## 10. Key Files Summary

| File | What it does |
|------|-------------|
| `lib/permissions.ts` | Lists all possible permission names (like a dictionary) |
| `lib/roles.ts` | Lists all possible role names (like a dictionary) |
| `lib/rbac.ts` | OLD hardcoded role→permission mapping (fallback only) |
| `lib/getUserPermissions.ts` | Fetches user's permissions from the database via SQL joins |
| `lib/requirePermission.ts` | Server-side guard: blocks page access if no permission |
| `lib/apiRequirePermissions.ts` | Server-side guard: blocks API calls if no permission |
| `lib/permission-context.tsx` | Client-side: React context that holds user's permissions |
| `lib/auth.ts` | Gets the currently logged-in user |
| `db/schemas/permissions.ts` | Database table definition for permissions |
| `db/schemas/roles.ts` | Database table definition for roles |
| `db/schemas/rolePermissions.ts` | Database table definition for role↔permission join |
| `db/schemas/users.ts` | Database table definition for users (has roleId) |
| `db/services/permissions.ts` | Functions to query/write permissions in DB |
| `db/services/roles.ts` | Functions to query/write roles in DB |
| `db/seed/role-permissions.ts` | Script to fill DB with initial data |
| `app/(superadmin)/layout.tsx` | Superadmin layout — fetches permissions, wraps with provider |
| `app/(superadmin)/dashboard/page.tsx` | Filters dashboard modules by VIEW permission |
| `app/(superadmin)/dashboard/roles/client.tsx` | UI for creating/editing roles and permissions |

---

## 11. One Last Thing — The "Add" and "Export" Bug

When this was first built, there was a bug:

- The UI label says **"Add"** but the DB permission is called **`CREATE_`**
- The UI label says **"Export"** but the DB permission is called **`DOWNLOAD_`**

So when you clicked the "Add" checkbox, the code generated `ADD_USERS` but the database checks for `CREATE_USERS` — they don't match, so the permission doesn't save.

**Fix:** The checkbox code now maps labels to the correct prefix:
```
"View"   → "VIEW"
"Add"    → "CREATE"    ← NOT "ADD"
"Update" → "UPDATE"
"Delete" → "DELETE"
"Export" → "DOWNLOAD"  ← NOT "EXPORT"
```
