import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { menuItems } from "./menu-items";
import { inventoryItems } from "./inventory";

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  contactPerson: varchar("contact_person", { length: 160 }),
  email: varchar("email", { length: 180 }),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 255 }),
  vatNumber: varchar("vat_number", { length: 80 }),
  paymentTerms: varchar("payment_terms", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const supplierProducts = mysqlTable("supplier_products", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).default("Other"),
  productType: mysqlEnum("product_type", ["direct_sellable", "inventory"]).notNull(),
  purchaseUnit: varchar("purchase_unit", { length: 40 }).default("Carton"),
  unitsPerPack: int("units_per_pack").default(1),
  sellUnit: varchar("sell_unit", { length: 40 }).default("Piece"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0"),
  margin: decimal("margin", { precision: 5, scale: 2 }).default("0"),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).default("0"),
  menuItemId: int("menu_item_id").references(() => menuItems.id, { onDelete: "set null" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 40 }).default("pcs"),
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).default("0"),
  inventoryItemId: int("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const supplierSettlements = mysqlTable("supplier_settlements", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["payment", "purchase"]).notNull(),
  paymentMethod: varchar("payment_method", { length: 40 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  notes: text("notes"),
  settlementDate: timestamp("settlement_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierProduct = typeof supplierProducts.$inferSelect;
export type NewSupplierProduct = typeof supplierProducts.$inferInsert;
export type SupplierSettlement = typeof supplierSettlements.$inferSelect;
export type NewSupplierSettlement = typeof supplierSettlements.$inferInsert;
