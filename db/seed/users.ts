import "../../envConfig";

import { createUser, getUserByEmail } from "@/db/services/users";
import { hashPassword } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME ?? "Super Admin"; 

async function main() {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required to seed users",
    );
  }

  const email = SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = await getUserByEmail(email);

  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  await createUser({
    name: SUPER_ADMIN_NAME,
    email,
    phone: null,
    address: null,
    passwordHash: hashPassword(SUPER_ADMIN_PASSWORD),
    role: "super-admin",
  });

  console.log(`Seeded super admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
