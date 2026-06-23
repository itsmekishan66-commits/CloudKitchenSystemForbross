import "../../envConfig";

import { createUser, getRoleIdByName, getUserByEmail } from "@/db/services/users";
import { hashPassword } from "@/lib/auth";

type SeedUser = {
  name: string;
  email: string;
  password: string;
role: "super-admin" | "admin" | "staff" | "kitchen-manager" | "payment-manager" | "support-staff" | "customer";
};

const users:SeedUser[] = [
  {
    name: process.env.SUPER_ADMIN_NAME ?? "Super Admin",
    email: process.env.SUPER_ADMIN_EMAIL!,
    password: process.env.SUPER_ADMIN_PASSWORD!,
    role: "super-admin" as const,
  },
  // {
  //   name: "Admin",
  //   email: "admin@example.com",
  //   password: "Admin123",
  //   role: "admin" as const,
  // },
  // {
  //   name: "Kitchen-Manager",
  //   email: "manager@example.com",
  //   password: "Manager123",
  //   role: "kitchen-manager" as const,
  // },
  // {
  //   name: "Payment-Manager",
  //   email: "payment@example.com",
  //   password: "payment123",
  //   role: "payment-manager" as const,
  // },
  // {
  //   name: "Staff",
  //   email: "staff@example.com",
  //   password: "staff123",
  //   role: "staff" as const,
  // },
  // {
  //   name: "Support-Staff",
  //   email: "supportstaff@example.com",
  //   password: "support123",
  //   role: "support-staff" as const,
  // },
];

async function main() {
  if (
    !process.env.SUPER_ADMIN_EMAIL ||
    !process.env.SUPER_ADMIN_PASSWORD
  ) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required",
    );
  }

  for (const user of users) {
    const email = user.email.toLowerCase();

    const existing = await getUserByEmail(email);

    if (existing) {
      console.log(`User already exists: ${email}`);
      continue;
    }

    const roleId = await getRoleIdByName(user.role);

    await createUser({
      name: user.name,
      email,
      phone: null,
      address: null,
      passwordHash: hashPassword(user.password),
      roleId: roleId ?? undefined,
    });

    console.log(`Seeded ${user.role}: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });