CREATE TABLE "messages" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"room_id" varchar(16) NOT NULL,
	"username" varchar(24) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_by_username" varchar(24) NOT NULL,
	"created_by_user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"username" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_idx" ON "messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "messages" USING btree ("created_at");