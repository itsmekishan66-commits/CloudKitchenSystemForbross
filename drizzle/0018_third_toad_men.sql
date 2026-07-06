CREATE TABLE `pending_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(180) NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40),
	`address` varchar(255),
	`password_hash` varchar(255) NOT NULL,
	`role_id` int,
	`otp` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_registrations_id` PRIMARY KEY(`id`)
);
