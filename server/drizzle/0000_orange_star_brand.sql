CREATE TABLE `execution_lists` (
	`execution_id` text NOT NULL,
	`list_id` text NOT NULL,
	PRIMARY KEY(`execution_id`, `list_id`),
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `execution_results` (
	`id` text PRIMARY KEY NOT NULL,
	`execution_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`list_id` text,
	`result` integer,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_exec_results_execution` ON `execution_results` (`execution_id`);--> statement-breakpoint
CREATE TABLE `executions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text,
	`tags` text DEFAULT '[]',
	`in_progress` integer DEFAULT true,
	`loops` integer DEFAULT 0,
	`current_index` integer DEFAULT 0,
	`config` text,
	`counters` text DEFAULT '{"correct":0,"incorrect":0,"noExecuted":0}',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_executions_user` ON `executions` (`user_id`);--> statement-breakpoint
CREATE TABLE `import_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`progress` integer DEFAULT 0,
	`total` integer DEFAULT 0,
	`error_msg` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	`finished_at` text
);
--> statement-breakpoint
CREATE TABLE `list_resources` (
	`list_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`list_id`, `resource_id`),
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_list_resources_list` ON `list_resources` (`list_id`);--> statement-breakpoint
CREATE TABLE `list_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`list_id` text NOT NULL,
	`executions` integer DEFAULT 0,
	`correct` integer DEFAULT 0,
	`incorrect` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_list_stats_unique` ON `list_stats` (`user_id`,`list_id`);--> statement-breakpoint
CREATE INDEX `idx_list_stats_user` ON `list_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tags` text DEFAULT '[]',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `resource_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`executions` integer DEFAULT 0,
	`correct` integer DEFAULT 0,
	`incorrect` integer DEFAULT 0,
	`last_exec` text,
	`last_result` integer,
	`favourite` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_resource_stats_unique` ON `resource_stats` (`user_id`,`resource_id`);--> statement-breakpoint
CREATE INDEX `idx_resource_stats_user` ON `resource_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`tags` text DEFAULT '[]',
	`content_es` text,
	`content_es_audio` text,
	`content_en` text,
	`content_en_audio` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_code_unique` ON `resources` (`code`);--> statement-breakpoint
CREATE INDEX `idx_resources_code` ON `resources` (`code`);--> statement-breakpoint
CREATE INDEX `idx_resources_type` ON `resources` (`type`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`executions` integer DEFAULT 0,
	`correct` integer DEFAULT 0,
	`incorrect` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_id_unique` ON `user_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false,
	`password_hash` text NOT NULL,
	`display_name` text,
	`avatar` text,
	`is_admin` integer DEFAULT false,
	`is_guest` integer DEFAULT false,
	`ui_settings` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);