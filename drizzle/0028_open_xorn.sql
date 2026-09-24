ALTER TABLE `payment_transactions` MODIFY COLUMN `order_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login` timestamp;--> statement-breakpoint
ALTER TABLE `payment_transactions` ADD `order_payload` json;