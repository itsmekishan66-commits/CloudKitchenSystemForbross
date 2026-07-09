CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(180) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `dues` ADD `order_id` int;