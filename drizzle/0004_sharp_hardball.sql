CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160),
	`email` varchar(180) NOT NULL,
	`phone` varchar(40),
	`subject` varchar(255),
	`message` text,
	`source` varchar(20) NOT NULL DEFAULT 'contact',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
