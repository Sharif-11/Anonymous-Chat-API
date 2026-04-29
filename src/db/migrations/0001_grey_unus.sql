ALTER TABLE "rooms" ALTER COLUMN "id" SET DATA TYPE varchar(16);--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "name" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_name_unique" UNIQUE("name");