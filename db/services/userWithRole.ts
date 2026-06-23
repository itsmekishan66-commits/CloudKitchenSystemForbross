// import {eq} from "drizzle-orm";
// import { db } from "@/db";
// import { roles, users } from "@/db/schemas";

// export async function getUserWithRoleById(id: number,) {
//     const [user] = await db.select({id:users.id,name:users.name,email:users.email,roleId:users.roleId,role:roles.name}).from(users).leftJoin(roles,eq(users.roleId,roles.id)).where(eq(users.id,id)).limit(1);
//     return user?? null;
// }