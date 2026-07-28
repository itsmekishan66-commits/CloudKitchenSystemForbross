ALTER TABLE `inventory_items` ADD `conversion_unit` varchar(40);--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `conversion_value` decimal(10,2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `conversion_unit` varchar(40);--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `conversion_value` decimal(10,2) DEFAULT '1';