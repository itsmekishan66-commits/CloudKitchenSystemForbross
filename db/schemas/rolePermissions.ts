import { int, mysqlTable, } from "drizzle-orm/mysql-core";
import { permissions } from "./permissions";
import { roles } from "./roles";

export const rolePermissions = mysqlTable("role_permissions", {
    roleId: int("role_id").notNull().references(() => roles.id),
    permissionId: int("permission_id").notNull().references(() => permissions.id),
});