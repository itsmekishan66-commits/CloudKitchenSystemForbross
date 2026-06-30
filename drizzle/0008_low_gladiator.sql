ALTER TABLE `suppliers` RENAME COLUMN `gst_number` TO `vat_number`;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `image` varchar(2048);--> statement-breakpoint
ALTER TABLE `menu_items` MODIFY COLUMN `image` varchar(2048);