CREATE TABLE `payment_accounts` (
	`id` varchar(36) NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`holder_name` varchar(255) NOT NULL,
	`method` enum('esewa','khalti','netbanking','card') NOT NULL,
	`account_number` varchar(255) NOT NULL,
	`phone_number` varchar(20),
	`bank_name` varchar(255),
	`branch` varchar(255),
	`opening_balance` decimal(10,2) DEFAULT '0',
	`notes` text,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `due_amount` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `promotions` ADD `image` varchar(500);--> statement-breakpoint
ALTER TABLE `transactions` ADD `account_id` varchar(36);