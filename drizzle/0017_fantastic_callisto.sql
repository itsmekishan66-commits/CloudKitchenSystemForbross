ALTER TABLE `users` ADD `email_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_otp` varchar(6);--> statement-breakpoint
ALTER TABLE `users` ADD `verification_otp_expires` timestamp;