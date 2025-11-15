CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`allDay` boolean NOT NULL DEFAULT false,
	`location` varchar(500),
	`color` varchar(7),
	`type` enum('personal','professional','meeting','reminder') NOT NULL DEFAULT 'personal',
	`googleEventId` varchar(255),
	`isSynced` boolean NOT NULL DEFAULT false,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
