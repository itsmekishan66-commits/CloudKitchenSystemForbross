CREATE TABLE `supplier_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(80) DEFAULT 'Other',
	`product_type` enum('direct_sellable','inventory') NOT NULL,
	`cost_price` decimal(10,2) DEFAULT '0',
	`margin` decimal(5,2) DEFAULT '0',
	`selling_price` decimal(10,2) DEFAULT '0',
	`menu_item_id` int,
	`quantity` decimal(10,2) DEFAULT '0',
	`unit` varchar(40) DEFAULT 'pcs',
	`min_stock_level` decimal(10,2) DEFAULT '0',
	`inventory_item_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` enum('payment','purchase') NOT NULL,
	`payment_method` varchar(40),
	`transaction_id` varchar(255),
	`notes` text,
	`settlement_date` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_settlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`contact_person` varchar(160),
	`email` varchar(180),
	`phone` varchar(40),
	`address` varchar(255),
	`gst_number` varchar(80),
	`payment_terms` varchar(255),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_settled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD CONSTRAINT `supplier_products_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD CONSTRAINT `supplier_products_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD CONSTRAINT `supplier_products_inventory_item_id_inventory_items_id_fk` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_settlements` ADD CONSTRAINT `supplier_settlements_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;