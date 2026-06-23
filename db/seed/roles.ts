// this is the code we used for static data before , which is now not useful as we adding roles and permission dynamically
// import "../../envConfig";

// import { db } from "@/db";
// import { roles } from "@/db/schemas";

// const defaultRoles = [
//   { name: "super-admin", description: "Full system access" },
//   { name: "admin", description: "Administrative access" },
//   { name: "staff", description: "General staff access" },
//   { name: "customer", description: "Regular customer" },
//   { name: "kitchen-manager", description: "Kitchen manager access" },
//   { name: "payment-manager", description: "Payment manager access" },
//   { name: "support-staff", description: "Support staff access" },
// ];

// async function main() {
//   for (const role of defaultRoles) {
//     try {
//       await db.insert(roles).values(role);
//     } catch {
//       // role already exists
//     }
//     console.log(`Seeded role: ${role.name}`);
//   }
// }

// main()
//   .catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
//   })
//   .finally(() => {
//     process.exit();
//   });
