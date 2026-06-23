CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_name` varchar(255) NOT NULL DEFAULT 'Cloud Kitchen',
	`logo` varchar(500),
	`contact_email` varchar(255),
	`contact_phone` varchar(50),
	`location` varchar(255),
	`about_content` json,
	`contact_content` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
