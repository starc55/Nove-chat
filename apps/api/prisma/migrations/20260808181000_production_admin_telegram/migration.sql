-- CreateEnum
CREATE TYPE "TelegramUpdateStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "TelegramDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "TelegramOperator" ADD COLUMN "lastInteractionAt" TIMESTAMP(3),
ADD COLUMN "telegramChatId" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TelegramUpdate" (
    "updateId" BIGINT NOT NULL,
    "status" "TelegramUpdateStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramUpdate_pkey" PRIMARY KEY ("updateId")
);

-- CreateTable
CREATE TABLE "TelegramDelivery" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "telegramOperatorId" TEXT NOT NULL,
    "status" "TelegramDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramUpdate_status_updatedAt_idx" ON "TelegramUpdate"("status", "updatedAt");
CREATE INDEX "TelegramDelivery_status_nextAttemptAt_idx" ON "TelegramDelivery"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "TelegramDelivery_messageId_telegramOperatorId_key" ON "TelegramDelivery"("messageId", "telegramOperatorId");
CREATE UNIQUE INDEX "TelegramOperator_telegramChatId_key" ON "TelegramOperator"("telegramChatId");
CREATE INDEX "TelegramOperator_enabled_verifiedAt_idx" ON "TelegramOperator"("enabled", "verifiedAt");

-- AddForeignKey
ALTER TABLE "TelegramDelivery" ADD CONSTRAINT "TelegramDelivery_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TelegramDelivery" ADD CONSTRAINT "TelegramDelivery_telegramOperatorId_fkey" FOREIGN KEY ("telegramOperatorId") REFERENCES "TelegramOperator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
