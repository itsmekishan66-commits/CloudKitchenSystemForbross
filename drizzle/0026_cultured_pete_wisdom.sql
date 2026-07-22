ALTER TABLE `reviews` DROP INDEX `user_menu_item_idx`;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `user_id` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `user_name` varchar(160);--> statement-breakpoint
ALTER TABLE `reviews` ADD `user_avatar` varchar(2048);