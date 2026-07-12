CREATE TABLE `account_balances` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`period` varchar(10) NOT NULL,
	`debit_total` decimal(14,2) NOT NULL DEFAULT '0',
	`credit_total` decimal(14,2) NOT NULL DEFAULT '0',
	`balance` decimal(14,2) NOT NULL DEFAULT '0',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chart_of_accounts` (
	`id` varchar(36) NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`sub_type` enum('current_asset','fixed_asset','current_liability','long_term_liability','equity','revenue','cogs','operating_expense','non_operating_expense') NOT NULL,
	`description` text,
	`parent_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`opening_balance` decimal(14,2) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chart_of_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `chart_of_accounts_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` varchar(36) NOT NULL,
	`entry_number` varchar(50) NOT NULL,
	`date` date NOT NULL,
	`description` text NOT NULL,
	`reference_type` varchar(50),
	`reference_id` varchar(255),
	`status` enum('draft','posted','voided') NOT NULL DEFAULT 'draft',
	`total_debit` decimal(14,2) NOT NULL DEFAULT '0',
	`total_credit` decimal(14,2) NOT NULL DEFAULT '0',
	`created_by` int,
	`void_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entries_entry_number_unique` UNIQUE(`entry_number`)
);
--> statement-breakpoint
CREATE TABLE `journal_entry_lines` (
	`id` varchar(36) NOT NULL,
	`journal_entry_id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`debit` decimal(14,2) NOT NULL DEFAULT '0',
	`credit` decimal(14,2) NOT NULL DEFAULT '0',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entry_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account_balances` ADD CONSTRAINT `account_balances_account_id_chart_of_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_journal_entry_id_journal_entries_id_fk` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_account_id_chart_of_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE no action ON UPDATE no action;