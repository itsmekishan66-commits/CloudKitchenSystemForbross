import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserPermissions } from "@/lib/getUserPermissions";
import { hasPermission, type Role, type Permission } from "@/lib/rbac";

// this is the code for assigning roles and permissions dynamically
// fetches the user's permissions from DB via role → permission join
// falls back to static hasPermission() if no DB permissions exist (legacy roles)
export default async function apiRequirePermissions(permission: string) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPermissions = await getUserPermissions(user.id);

    const allowed = userPermissions.length > 0
        ? userPermissions.includes(permission)
        : hasPermission(user.role as Role, permission as Permission);

    if (!allowed) {
        return NextResponse.json({ error: "Forbidden- you are not authorized to access this resource" }, { status: 403 });
    }
    return user;
}
