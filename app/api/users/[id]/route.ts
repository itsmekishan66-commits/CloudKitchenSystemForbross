import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { users, roles } from "@/db/schemas";
import { getUserByEmail, getRoleIdByName } from "@/db/services";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser.role as never, PERMISSIONS.UPDATE_USERS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { name, email, phone, address, role, password } = await request.json();

    if (email) {
      const existing = await getUserByEmail(email.toLowerCase());
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
    }

    if (role) {
      const [target] = await db
        .select({ currentRole: roles.name })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (target?.currentRole === "super-admin" && role !== "super-admin") {
        return NextResponse.json({ error: "Cannot change a super-admin's role" }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(password);
    }
    if (role) {
      const roleId = await getRoleIdByName(role);
      if (!roleId) {
        return NextResponse.json({ error: `Role "${role}" not found` }, { status: 400 });
      }
      updateData.roleId = roleId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser.role as never, PERMISSIONS.DELETE_USERS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user", error);
    return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
  }
}
