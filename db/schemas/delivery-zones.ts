import { boolean, decimal, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const deliveryZones = mysqlTable("delivery_zones", {
    id: int("id").autoincrement().primaryKey(),
    landmarkName: varchar("landmark", { length: 200 }).notNull(),
    deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).notNull().default("0"),
    minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type NewDeliveryZone = typeof deliveryZones.$inferInsert;