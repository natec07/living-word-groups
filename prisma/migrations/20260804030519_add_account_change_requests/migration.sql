-- CreateEnum
CREATE TYPE "AccountChangeType" AS ENUM ('EMAIL', 'PASSWORD');

-- CreateTable
CREATE TABLE "AccountChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AccountChangeType" NOT NULL,
    "newValue" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountChangeRequest_userId_type_idx" ON "AccountChangeRequest"("userId", "type");

-- AddForeignKey
ALTER TABLE "AccountChangeRequest" ADD CONSTRAINT "AccountChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
