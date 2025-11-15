ALTER TABLE `calendarEvents` ADD `isRecurring` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `calendarEvents` ADD `recurrencePattern` enum('none','daily','weekly','monthly','yearly') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendarEvents` ADD `recurrenceEndDate` datetime;--> statement-breakpoint
ALTER TABLE `calendarEvents` ADD `recurrenceParentId` int;