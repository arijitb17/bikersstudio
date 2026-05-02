-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hasSize" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sizes" JSONB;
