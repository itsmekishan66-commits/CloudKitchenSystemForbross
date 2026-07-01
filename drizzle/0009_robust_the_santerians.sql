CREATE TABLE `delivery_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`landmark` varchar(200) NOT NULL,
	`delivery_charge` decimal(10,2) NOT NULL DEFAULT '0',
	`min_order_amount` decimal(10,2),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_charge` decimal(10,2) DEFAULT '0' NOT NULL;