-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_campusId_fkey";

-- DropIndex
DROP INDEX "Profile_campusId_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "campusId",
DROP COLUMN "directoryOptOut",
DROP COLUMN "maritalStatus",
DROP COLUMN "testimony";

-- DropTable
DROP TABLE "Campus";

-- DropEnum
DROP TYPE "MaritalStatus";

