import {
    int,
    mysqlTable,
    text,
    timestamp,
    decimal,
    varchar,
} from "drizzle-orm/mysql-core";

import { menuItems } from "./menu-items";
import { users } from "./users";

export const reviews = mysqlTable(
    "reviews",
    {
        id: int("id").autoincrement().primaryKey(),
        userId: int("user_id").references(() => users.id, { onDelete: "cascade" }),
        menuItemId: int("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
        rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
        comment: text("comment"),
        userName: varchar("user_name", { length: 160 }),
        userAvatar: varchar("user_avatar", { length: 2048 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    }
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
