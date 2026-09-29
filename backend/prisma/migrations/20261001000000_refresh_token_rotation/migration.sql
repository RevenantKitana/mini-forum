-- AlterTable: add family_id and is_revoked to refresh_tokens for Refresh Token Rotation & Reuse Detection
ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "refresh_tokens" ADD COLUMN "is_revoked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
