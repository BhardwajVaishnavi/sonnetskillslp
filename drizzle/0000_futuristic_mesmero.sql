CREATE TABLE `attribution` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`order_id` text NOT NULL,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_content` text,
	`utm_term` text,
	`referrer` text,
	`landing_page_url` text,
	`session_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`country_code` text DEFAULT '+91' NOT NULL,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`terms_accepted_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`cashfree_order_id` text,
	`payment_status` text NOT NULL,
	`checkout_status` text NOT NULL,
	`payment_method` text,
	`transaction_id` text,
	`paid_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
