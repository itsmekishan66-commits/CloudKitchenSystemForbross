CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`provider` enum('esewa','khalti') NOT NULL,
	`transaction_uuid` varchar(128) NOT NULL,
	`pidx` varchar(64),
	`gateway_ref_id` varchar(128),
	`amount` decimal(10,2) NOT NULL,
	`status` enum('initiated','success','failed','cancelled','expired','pending') NOT NULL DEFAULT 'initiated',
	`raw_response` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `payment_method` enum('COD','ONLINE','ESEWA','KHALTI') NOT NULL DEFAULT 'COD';--> statement-breakpoint
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;