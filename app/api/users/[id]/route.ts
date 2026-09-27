import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { hashPassword } from "@/lib/auth";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { users, roles } from "@/db/schemas";
import { getUserByEmail, getRoleIdByName } from "@/db/services";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await apiRequirePermissions(PERMISSIONS.VIEW_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      isGuest: users.isGuest,
      creditBalance: users.creditBalance,
      createdAt: users.createdAt,
      role: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, userId), eq(users.deleted, false)))
    .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch user", error);
    return NextResponse.json({ error: "Unable to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await apiRequirePermissions(PERMISSIONS.UPDATE_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
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
      if (role === "super-admin") {
        return NextResponse.json(
          { error: "The super-admin role cannot be assigned via this endpoint" },
          { status: 403 },
        );
      }

      const [target] = await db
        .select({ currentRole: roles.name })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(and(eq(users.id, userId), eq(users.deleted, false)))
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
    const currentUser = await apiRequirePermissions(PERMISSIONS.DELETE_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    await db.update(users).set({ deleted: true }).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user", error);
    return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
  }
}

// Flips the soft-delete flag. Used by the Recovery tab's activate/deactivate
// toggle: { deleted: false } restores the account, { deleted: true } hides it again.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await apiRequirePermissions(PERMISSIONS.DELETE_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { deleted } = await request.json();
    if (typeof deleted !== "boolean") {
      return NextResponse.json(
        { error: "`deleted` must be a boolean" },
        { status: 400 },
      );
    }

    const [target] = await db
      .select({ email: users.email, role: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Guard against locking every administrator out of the system.
    if (deleted && target.role === "super-admin") {
      return NextResponse.json(
        { error: "A super-admin account cannot be deactivated" },
        { status: 403 },
      );
    }

    // Restoring must not create a duplicate email, which is how sign-in and
    // password reset resolve a user.
    if (!deleted && target.email) {
      const existing = await getUserByEmail(target.email);
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { error: "Another active user already uses this email" },
          { status: 409 },
        );
      }
    }

    await db.update(users).set({ deleted }).where(eq(users.id, userId));

    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("Failed to update user status", error);
    return NextResponse.json({ error: "Unable to update user status" }, { status: 500 });
  }
}
