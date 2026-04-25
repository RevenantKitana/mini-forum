-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_imagekit_file_id" TEXT,
ADD COLUMN     "avatar_preview_url" TEXT,
ADD COLUMN     "avatar_standard_url" TEXT;

-- CreateTable
CREATE TABLE "post_media" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "imagekit_file_id" TEXT NOT NULL,
    "preview_url" TEXT NOT NULL,
    "standard_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_media_post_id_idx" ON "post_media"("post_id");

-- CreateIndex
CREATE INDEX "post_media_sort_order_idx" ON "post_media"("sort_order");

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
