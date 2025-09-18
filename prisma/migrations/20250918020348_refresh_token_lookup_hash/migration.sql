/*
  Warnings:

  - You are about to drop the column `token_hash` on the `refresh_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lookup_hash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lookup_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."refresh_tokens_token_hash_idx";

-- DropIndex
DROP INDEX "public"."refresh_tokens_token_hash_key";

-- AlterTable
ALTER TABLE "public"."refresh_tokens" DROP COLUMN "token_hash",
ADD COLUMN     "lookup_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_lookup_hash_key" ON "public"."refresh_tokens"("lookup_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_lookup_hash_idx" ON "public"."refresh_tokens"("lookup_hash");
