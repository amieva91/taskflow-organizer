CREATE TABLE `quickNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`isCompleted` int NOT NULL DEFAULT 0,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`convertedToTaskId` int,
	CONSTRAINT `quickNotes_id` PRIMARY KEY(`id`)
);
