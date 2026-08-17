CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`is_company` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `car_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`base_price` integer NOT NULL,
	`price_per_km` real NOT NULL,
	`capacity` integer NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendor_cars` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`model_id` text NOT NULL,
	`plate_number` text NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`model_id`) REFERENCES `car_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendor_cars_vendor_id_idx` ON `vendor_cars` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `chauffeurs` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`license_number` text NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chauffeurs_vendor_id_idx` ON `chauffeurs` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `rides` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`model_id` text NOT NULL,
	`pickup` text NOT NULL,
	`dropoff` text NOT NULL,
	`pickup_time` text NOT NULL,
	`distance_km` real NOT NULL,
	`price` real NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`confirmed_at` text,
	`started_at` text,
	`completed_at` text,
	`cancelled_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`model_id`) REFERENCES `car_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rides_status_idx` ON `rides` (`status`);--> statement-breakpoint
CREATE INDEX `rides_customer_id_idx` ON `rides` (`customer_id`);--> statement-breakpoint
CREATE TABLE `ride_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`ride_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`vendor_car_id` text,
	`chauffeur_id` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`accepted_at` text,
	`rejected_at` text,
	`released_at` text,
	FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_car_id`) REFERENCES `vendor_cars`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chauffeur_id`) REFERENCES `chauffeurs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ride_offers_ride_id_idx` ON `ride_offers` (`ride_id`);--> statement-breakpoint
CREATE INDEX `ride_offers_vendor_id_idx` ON `ride_offers` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `ride_offers_chauffeur_id_idx` ON `ride_offers` (`chauffeur_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_role` text NOT NULL,
	`recipient_id` text,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`payload` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_role`,`recipient_id`);