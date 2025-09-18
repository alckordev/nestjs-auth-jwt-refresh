-- AlterTable
ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "user_agent" DROP NOT NULL,
ALTER COLUMN "ip_address" DROP NOT NULL;
