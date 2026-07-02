import "../../envConfig";

import { db } from "@/db";
import { roles, permissions, rolePermissions } from "@/db/schemas";
import { eq, inArray } from "drizzle-orm";

const rolePermissionMap: Record<string, string[]> = {
  "super-admin": [
    "VIEW_USERS", "CREATE_USERS", "UPDATE_USERS", "DELETE_USERS", "DOWNLOAD_USERS",
    "VIEW_GUEST_USERS", "CREATE_GUEST_USERS", "UPDATE_GUEST_USERS", "DELETE_GUEST_USERS", "DOWNLOAD_GUEST_USERS",
    "VIEW_DASHBOARD",
    "VIEW_KITCHENS", "CREATE_KITCHENS", "UPDATE_KITCHENS", "DELETE_KITCHENS", "DOWNLOAD_KITCHENS",
    "VIEW_MENUS", "CREATE_MENUS", "UPDATE_MENUS", "DELETE_MENUS", "DOWNLOAD_MENUS",
    "VIEW_ORDERS", "CREATE_ORDERS", "UPDATE_ORDERS", "DELETE_ORDERS", "DOWNLOAD_ORDERS",
    "VIEW_REPORTS", "CREATE_REPORTS", "UPDATE_REPORTS", "DELETE_REPORTS", "DOWNLOAD_REPORTS",
    "VIEW_PAYMENTS", "CREATE_PAYMENTS", "UPDATE_PAYMENTS", "DELETE_PAYMENTS", "DOWNLOAD_PAYMENTS",
    "VIEW_INVENTORY", "CREATE_INVENTORY", "UPDATE_INVENTORY", "DELETE_INVENTORY", "DOWNLOAD_INVENTORY",
    "VIEW_CATEGORIES", "CREATE_CATEGORIES", "UPDATE_CATEGORIES", "DELETE_CATEGORIES", "DOWNLOAD_CATEGORIES",
    "VIEW_SETTINGS", "CREATE_SETTINGS", "UPDATE_SETTINGS", "DELETE_SETTINGS", "DOWNLOAD_SETTINGS",
    "VIEW_PROMOTIONS", "CREATE_PROMOTIONS", "UPDATE_PROMOTIONS", "DELETE_PROMOTIONS", "DOWNLOAD_PROMOTIONS",
    "VIEW_SUPPORTS", "CREATE_SUPPORTS", "UPDATE_SUPPORTS", "DELETE_SUPPORTS", "DOWNLOAD_SUPPORTS",
    "VIEW_ROLES", "CREATE_ROLES", "UPDATE_ROLES", "DELETE_ROLES", "DOWNLOAD_ROLES",
    "VIEW_MESSAGES", "DELETE_MESSAGES",
    "VIEW_SUPPLIERS", "CREATE_SUPPLIERS", "UPDATE_SUPPLIERS", "DELETE_SUPPLIERS", "DOWNLOAD_SUPPLIERS",
    "VIEW_RECIPES", "CREATE_RECIPES", "UPDATE_RECIPES", "DELETE_RECIPES",
  ],
  admin: [
    "VIEW_USERS", "CREATE_USERS", "UPDATE_USERS", "DELETE_USERS", "DOWNLOAD_USERS",
    "VIEW_GUEST_USERS", "CREATE_GUEST_USERS", "UPDATE_GUEST_USERS", "DELETE_GUEST_USERS", "DOWNLOAD_GUEST_USERS",
    "VIEW_DASHBOARD",
    "VIEW_KITCHENS", "CREATE_KITCHENS", "UPDATE_KITCHENS", "DELETE_KITCHENS", "DOWNLOAD_KITCHENS",
    "VIEW_MENUS", "CREATE_MENUS", "UPDATE_MENUS", "DELETE_MENUS", "DOWNLOAD_MENUS",
    "VIEW_ORDERS", "CREATE_ORDERS", "UPDATE_ORDERS", "DELETE_ORDERS", "DOWNLOAD_ORDERS",
    "VIEW_REPORTS", "CREATE_REPORTS", "UPDATE_REPORTS", "DELETE_REPORTS", "DOWNLOAD_REPORTS",
    "VIEW_PAYMENTS", "CREATE_PAYMENTS", "UPDATE_PAYMENTS", "DELETE_PAYMENTS", "DOWNLOAD_PAYMENTS",
    "VIEW_INVENTORY", "CREATE_INVENTORY", "UPDATE_INVENTORY", "DELETE_INVENTORY", "DOWNLOAD_INVENTORY",
    "VIEW_CATEGORIES", "CREATE_CATEGORIES", "UPDATE_CATEGORIES", "DELETE_CATEGORIES", "DOWNLOAD_CATEGORIES",
    "VIEW_SETTINGS", "CREATE_SETTINGS", "UPDATE_SETTINGS", "DELETE_SETTINGS", "DOWNLOAD_SETTINGS",
    "VIEW_PROMOTIONS", "CREATE_PROMOTIONS", "UPDATE_PROMOTIONS", "DELETE_PROMOTIONS", "DOWNLOAD_PROMOTIONS",
    "VIEW_SUPPORTS", "CREATE_SUPPORTS", "UPDATE_SUPPORTS", "DELETE_SUPPORTS", "DOWNLOAD_SUPPORTS",
    "VIEW_ROLES", "CREATE_ROLES", "UPDATE_ROLES", "DELETE_ROLES", "DOWNLOAD_ROLES",
    "VIEW_MESSAGES", "DELETE_MESSAGES",
    "VIEW_SUPPLIERS", "CREATE_SUPPLIERS", "UPDATE_SUPPLIERS", "DELETE_SUPPLIERS", "DOWNLOAD_SUPPLIERS",
    "VIEW_RECIPES", "CREATE_RECIPES", "UPDATE_RECIPES", "DELETE_RECIPES",
  ],
  staff: [
    "VIEW_DASHBOARD",
    "VIEW_REPORTS",
    "VIEW_PAYMENTS",
    "VIEW_CATEGORIES",
    "VIEW_MENUS",
    "VIEW_INVENTORY",
  ],
  "kitchen-manager": [
    "VIEW_DASHBOARD",
    "VIEW_MENUS", "CREATE_MENUS", "UPDATE_MENUS",
    "VIEW_ORDERS", "UPDATE_ORDERS",
    "VIEW_KITCHENS",
    "VIEW_CATEGORIES", "UPDATE_CATEGORIES",
    "VIEW_INVENTORY", "UPDATE_INVENTORY",
    "VIEW_RECIPES", "CREATE_RECIPES", "UPDATE_RECIPES",
  ],
  "payment-manager": [
    "VIEW_DASHBOARD",
    "VIEW_PAYMENTS", "CREATE_PAYMENTS", "UPDATE_PAYMENTS",
    "VIEW_REPORTS", "DOWNLOAD_REPORTS",
  ],
  "support-staff": [
    "VIEW_DASHBOARD",
    "VIEW_SUPPORTS", "CREATE_SUPPORTS", "UPDATE_SUPPORTS",
    "VIEW_REPORTS",
  ],
  customer: [],
};

async function main() {
  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);

  for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
    const role = allRoles.find((r) => r.name === roleName);
    if (!role) {
      console.log(`Role not found: ${roleName}`);
      continue;
    }

    const existingRp = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));

    if (existingRp.length > 0) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    }

    if (permNames.length === 0) {
      console.log(`Skipped ${roleName} (no permissions)`);
      continue;
    }

    const permRecords = allPerms.filter((p) => permNames.includes(p.name));
    for (const perm of permRecords) {
      await db.insert(rolePermissions).values({
        roleId: role.id,
        permissionId: perm.id,
      });
    }
    console.log(`Seeded ${permRecords.length} permissions for ${roleName}`);
  }

  console.log("Role-permissions seeding complete");
}

main().catch(console.error).finally(() => process.exit());
