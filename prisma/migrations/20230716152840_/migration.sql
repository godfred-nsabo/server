/*
  Warnings:

  - Changed the type of `subject` on the `Contact` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "subject",
ADD COLUMN     "subject" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Subject";
