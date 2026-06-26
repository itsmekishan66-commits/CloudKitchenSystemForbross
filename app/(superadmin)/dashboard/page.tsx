import { requirePermission } from "@/lib/requirePermission";
import { getUserPermissions } from "@/lib/getUserPermissions";
import { hasPermission, type Role, type Permission } from "@/lib/rbac";
import DashboardClient from "./client";

// this is the code for assigning roles and permissions dynamically
// module routes mapped to their required DB permission names (fetched from DB)
const modulePermissions: Record<string, string> = {
  "/dashboard/orders": "VIEW_ORDERS",
  "/dashboard/customers": "VIEW_USERS",
  "/dashboard/guest-users": "VIEW_GUEST_USERS",
  "/dashboard/kitchen": "VIEW_KITCHENS",
  "/dashboard/menu": "VIEW_MENUS",
  "/dashboard/inventory": "VIEW_INVENTORY",
  "/dashboard/payment": "VIEW_PAYMENTS",
  "/dashboard/support": "VIEW_SUPPORTS",
  "/dashboard/reports": "VIEW_REPORTS",
  "/dashboard/promotions": "VIEW_PROMOTIONS",
  "/dashboard/settings": "VIEW_SETTINGS",
  "/dashboard/roles": "VIEW_ROLES",
  "/dashboard/categories": "VIEW_CATEGORIES",
  "/dashboard/messages": "VIEW_MESSAGES",
};


const DashboardPage = async () => {
  const user = await requirePermission("VIEW_DASHBOARD");

  // this is the code for assigning roles and permissions dynamically
  // filter allowed modules based on user's DB-stored permissions
  // fallback to static RBAC if no DB permissions exist (legacy roles)
  const userPermissions = await getUserPermissions(user.id);
  const useDbPermissions = userPermissions.length > 0;
  const allowedModules = Object.entries(modulePermissions)
    .filter(([_, perm]) =>
      useDbPermissions
        ? userPermissions.includes(perm)
        : hasPermission(user.role as Role, perm as Permission),
    )
    .map(([href]) => href);

  return <DashboardClient allowedModules={allowedModules} />;
};

export default DashboardPage;
