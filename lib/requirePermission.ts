import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserPermissions } from "@/lib/getUserPermissions";
import { hasPermission, type Role, type Permission } from "@/lib/rbac";

// this is the code for assigning roles and permissions dynamically
// fetches the user's permissions from DB via role → permission join
// falls back to static hasPermission() if no DB permissions exist (legacy roles)
export async function requirePermission(permission: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userPermissions = await getUserPermissions(user.id);

  // if DB has permissions for this user, use them
  // otherwise fall back to static hasPermission for legacy roles
  const allowed = userPermissions.length > 0
    ? userPermissions.includes(permission)
    : hasPermission(user.role as Role, permission as Permission);

  if (!allowed) {
    redirect("/unauthorized");
  }

  return user;
}
