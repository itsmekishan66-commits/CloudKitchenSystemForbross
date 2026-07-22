CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`menu_item_id` int NOT NULL,
	`rating` decimal(2,1) NOT NULL DEFAULT '3.5',
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_menu_item_idx` UNIQUE(`user_id`,`menu_item_id`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE cascade ON UPDATE no action;