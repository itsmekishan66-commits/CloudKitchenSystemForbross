import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { hashPassword } from "@/lib/auth";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { users, roles } from "@/db/schemas";
import { createUser, getRoleIdByName, getUserByEmail } from "@/db/services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const currentUser = await apiRequirePermissions(PERMISSIONS.CREATE_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { name, email, password, role, phone, address } = await request.json();

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and a password of at least 8 characters are required" },
        { status: 400 },
      );
    }

    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const roleName = role || "customer";
    const roleId = await getRoleIdByName(roleName);
    if (!roleId) {
      return NextResponse.json({ error: `Role "${roleName}" not found` }, { status: 400 });
    }

    const userId = await createUser({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      roleId,
      phone: phone || null,
      address: address || null,
    });

    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    console.error("Failed to create user", error);
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await apiRequirePermissions(PERMISSIONS.VIEW_USERS);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const isGuest = searchParams.get("isGuest");

    const query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        roleId: users.roleId,
        isGuest: users.isGuest,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(users.name);

    let filtered = await query;
    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (isGuest === "true") {
      filtered = filtered.filter((u) => u.isGuest === true);
    } else if (isGuest === "false") {
      filtered = filtered.filter((u) => u.isGuest === false || u.isGuest === null);
    }
    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error("Failed to load users", error);
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  }
}
