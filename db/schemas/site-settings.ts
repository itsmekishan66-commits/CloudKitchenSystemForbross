import {
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  siteName: varchar("site_name", { length: 255 }).notNull().default("Cloud Kitchen"),
  logo: text("logo"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  aboutContent: json("about_content"),
  contactContent: json("contact_content"),
  homeVideoBurger: json("home_video_burger"),
  home3dSliderVideos: json("home_3d_slider_videos"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;
