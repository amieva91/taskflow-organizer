CREATE TABLE `reminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`defaultMinutesBefore` int NOT NULL DEFAULT 30,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminderSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `reminderSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `sentReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`eventId` varchar(255),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`type` enum('push','email') NOT NULL,
	CONSTRAINT `sentReminders_id` PRIMARY KEY(`id`)
);
