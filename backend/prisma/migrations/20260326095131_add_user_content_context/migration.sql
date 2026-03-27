-- CreateTable
CREATE TABLE "user_content_context" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "personality" JSONB NOT NULL,
    "last_posts" JSONB NOT NULL DEFAULT '[]',
    "last_comments" JSONB NOT NULL DEFAULT '[]',
    "action_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_content_context_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_content_context_user_id_key" ON "user_content_context"("user_id");

-- CreateIndex
CREATE INDEX "user_content_context_user_id_idx" ON "user_content_context"("user_id");

-- AddForeignKey
ALTER TABLE "user_content_context" ADD CONSTRAINT "user_content_context_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
