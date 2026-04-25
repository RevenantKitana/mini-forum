-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable: add use_block_layout to posts
ALTER TABLE "posts" ADD COLUMN "use_block_layout" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add block_id to post_media
ALTER TABLE "post_media" ADD COLUMN "block_id" INTEGER;

-- CreateTable: post_blocks
CREATE TABLE "post_blocks" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_blocks_post_id_idx" ON "post_blocks"("post_id");
CREATE INDEX "post_blocks_sort_order_idx" ON "post_blocks"("sort_order");
CREATE INDEX "post_media_block_id_idx" ON "post_media"("block_id");

-- AddForeignKey: post_blocks.post_id → posts.id
ALTER TABLE "post_blocks" ADD CONSTRAINT "post_blocks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: post_media.block_id → post_blocks.id (nullable, set null on delete)
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "post_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
