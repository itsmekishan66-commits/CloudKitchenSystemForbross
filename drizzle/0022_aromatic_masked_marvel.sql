CREATE TABLE `cooked_food_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_item_id` int NOT NULL,
	`category_id` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cooked_food_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cooked_food_stock` ADD CONSTRAINT `cooked_food_stock_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cooked_food_stock` ADD CONSTRAINT `cooked_food_stock_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;