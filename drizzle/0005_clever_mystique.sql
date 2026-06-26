CREATE TABLE `dues` (
	`id` varchar(36) NOT NULL,
	`person_name` varchar(255) NOT NULL,
	`role` enum('customer','supplier','staff') NOT NULL,
	`total_due` decimal(10,2) NOT NULL DEFAULT '0',
	`paid` decimal(10,2) NOT NULL DEFAULT '0',
	`remaining` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`type` enum('cash_received','cash_paid','online_received','online_paid','expense','bank_transfer','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`received_from` varchar(255),
	`paid_to` varchar(255),
	`payment_method` enum('cash','bank','esewa','khalti','fonepay','card') NOT NULL,
	`transaction_id` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
