// this is the code we used for static data before , which is now not useful as we adding roles and permission dynamically
// import "../../envConfig";

// import { db } from "@/db";
// import { permissions } from "@/db/schemas";

// const defaultPermissions = [
//     { name: "VIEW_USERS", description: "View users" },
//     { name: "CREATE_USERS", description: "Create users" },
//     { name: "UPDATE_USERS", description: "Update users" },
//     { name: "DELETE_USERS", description: "Delete users" },
//     { name: "DOWNLOAD_USERS", description: "Download users" },

//     { name: "VIEW_GUEST_USERS", description: "View guest users" },
//     { name: "CREATE_GUEST_USERS", description: "Create guest users" },
//     { name: "UPDATE_GUEST_USERS", description: "Update guest users" },
//     { name: "DELETE_GUEST_USERS", description: "Delete guest users" },
//     { name: "DOWNLOAD_GUEST_USERS", description: "Download guest users" },

//     { name: "VIEW_DASHBOARD", description: "View dashboard" },

//     { name: "VIEW_KITCHENS", description: "View kitchens" },
//     { name: "CREATE_KITCHENS", description: "Create kitchens" },
//     { name: "UPDATE_KITCHENS", description: "Update kitchens" },
//     { name: "DELETE_KITCHENS", description: "Delete kitchens" },
//     { name: "DOWNLOAD_KITCHENS", description: "Download kitchens" },

//     { name: "VIEW_MENUS", description: "View menus" },
//     { name: "CREATE_MENUS", description: "Create menus" },
//     { name: "UPDATE_MENUS", description: "Update menus" },
//     { name: "DELETE_MENUS", description: "Delete menus" },
//     { name: "DOWNLOAD_MENUS", description: "Download menus" },

//     { name: "VIEW_ORDERS", description: "View orders" },
//     { name: "CREATE_ORDERS", description: "Create orders" },
//     { name: "UPDATE_ORDERS", description: "Update orders" },
//     { name: "DELETE_ORDERS", description: "Delete orders" },
//     { name: "DOWNLOAD_ORDERS", description: "Download orders" },

//     { name: "VIEW_REPORTS", description: "View reports" },
//     { name: "CREATE_REPORTS", description: "Create reports" },
//     { name: "UPDATE_REPORTS", description: "Update reports" },
//     { name: "DELETE_REPORTS", description: "Delete reports" },
//     { name: "DOWNLOAD_REPORTS", description: "Download reports" },

//     { name: "VIEW_PAYMENTS", description: "View payments" },
//     { name: "CREATE_PAYMENTS", description: "Create payments" },
//     { name: "UPDATE_PAYMENTS", description: "Update payments" },
//     { name: "DELETE_PAYMENTS", description: "Delete payments" },
//     { name: "DOWNLOAD_PAYMENTS", description: "Download payments" },

//     { name: "VIEW_INVENTORY", description: "View inventory" },
//     { name: "CREATE_INVENTORY", description: "Create inventory" },
//     { name: "UPDATE_INVENTORY", description: "Update inventory" },
//     { name: "DELETE_INVENTORY", description: "Delete inventory" },
//     { name: "DOWNLOAD_INVENTORY", description: "Download inventory" },

//     { name: "VIEW_CATEGORIES", description: "View categories" },
//     { name: "CREATE_CATEGORIES", description: "Create categories" },
//     { name: "UPDATE_CATEGORIES", description: "Update categories" },
//     { name: "DELETE_CATEGORIES", description: "Delete categories" },
//     { name: "DOWNLOAD_CATEGORIES", description: "Download categories" },

//     { name: "VIEW_SETTINGS", description: "View settings" },
//     { name: "CREATE_SETTINGS", description: "Create settings" },
//     { name: "UPDATE_SETTINGS", description: "Update settings" },
//     { name: "DELETE_SETTINGS", description: "Delete settings" },
//     { name: "DOWNLOAD_SETTINGS", description: "Download settings" },

//     { name: "VIEW_PROMOTIONS", description: "View promotions" },
//     { name: "CREATE_PROMOTIONS", description: "Create promotions" },
//     { name: "UPDATE_PROMOTIONS", description: "Update promotions" },
//     { name: "DELETE_PROMOTIONS", description: "Delete promotions" },
//     { name: "DOWNLOAD_PROMOTIONS", description: "Download promotions" },

//     { name: "VIEW_SUPPORTS", description: "View supports" },
//     { name: "CREATE_SUPPORTS", description: "Create supports" },
//     { name: "UPDATE_SUPPORTS", description: "Update supports" },
//     { name: "DELETE_SUPPORTS", description: "Delete supports" },
//     { name: "DOWNLOAD_SUPPORTS", description: "Download supports" },

//     { name: "VIEW_ROLES", description: "View roles" },
//     { name: "CREATE_ROLES", description: "Create roles" },
//     { name: "UPDATE_ROLES", description: "Update roles" },
//     { name: "DELETE_ROLES", description: "Delete roles" },
//     { name: "DOWNLOAD_ROLES", description: "Download roles" },

//     { name: "VIEW_MESSAGES", description: "View messages" },
//     { name: "DELETE_MESSAGES", description: "Delete messages" },
// ];

// async function seedPermissions() {
//     for (const permission of defaultPermissions) {
//         try {
//             await db.insert(permissions).values({
//                 name: permission.name,
//                 description: permission.description,
//             });

//             console.log(`Seeded permission: ${permission.name}`);
//         } catch (error) {
//             console.log(`Permission already exists: ${permission.name}`);
//         }
//     }
// }

// seedPermissions()
//     .then(() => {
//         console.log("Permissions seeding complete");
//         process.exit(0);
//     })
//     .catch((err) => {
//         console.error("Seeding failed:", err);
//         process.exit(1);
//     });
