CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`notificationMinutes` int NOT NULL DEFAULT 15,
	`notifyPersonal` boolean NOT NULL DEFAULT false,
	`notifyProfessional` boolean NOT NULL DEFAULT false,
	`notifyMeeting` boolean NOT NULL DEFAULT true,
	`notifyReminder` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notificationSettings` ADD CONSTRAINT `notificationSettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;