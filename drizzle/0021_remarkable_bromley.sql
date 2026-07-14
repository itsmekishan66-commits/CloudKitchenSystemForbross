CREATE TABLE `support_ticket_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int,
	`user_id` int,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_ticket_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `support_tickets` RENAME COLUMN `assigned_to` TO `resolution_note`;--> statement-breakpoint
ALTER TABLE `support_tickets` MODIFY COLUMN `resolution_note` text;--> statement-breakpoint
ALTER TABLE `support_ticket_replies` ADD CONSTRAINT `support_ticket_replies_ticket_id_support_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_ticket_replies` ADD CONSTRAINT `support_ticket_replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;