CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`menu_item_id` int NOT NULL,
	`rating` decimal(2,1) NOT NULL,
	`comment` text,
	`user_name` varchar(160),
	`user_avatar` varchar(2048),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `conversion_unit` varchar(40);--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `conversion_value` decimal(10,2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `conversion_unit` varchar(40);--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `conversion_value` decimal(10,2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE cascade ON UPDATE no action;