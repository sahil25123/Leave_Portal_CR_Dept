/*
  Warnings:

  - You are about to drop the column `hodApproved` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `hodId` on the `Leave` table. All the data in the column will be lost.
  - The values [pending_hod] on the enum `Leave_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [hod] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,yearId]` on the table `LeaveBalance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `yearId` to the `Leave` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearId` to the `LeaveBalance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Leave` DROP FOREIGN KEY `Leave_hodId_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveBalance` DROP FOREIGN KEY `LeaveBalance_userId_fkey`;

-- DropIndex
DROP INDEX `Leave_hodId_fkey` ON `Leave`;

-- DropIndex
DROP INDEX `LeaveBalance_userId_year_key` ON `LeaveBalance`;

-- AlterTable
ALTER TABLE `Leave` DROP COLUMN `hodApproved`,
    DROP COLUMN `hodId`,
    ADD COLUMN `halfDayType` ENUM('first_half', 'second_half') NULL,
    ADD COLUMN `yearId` INTEGER NOT NULL,
    MODIFY `status` ENUM('pending_dean', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending_dean';

-- AlterTable
ALTER TABLE `LeaveBalance` ADD COLUMN `yearId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `role` ENUM('staff', 'dean', 'admin') NOT NULL DEFAULT 'staff';

-- CreateTable
CREATE TABLE `LeaveYear` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `monthlyLimit` DOUBLE NOT NULL DEFAULT 2.5,
    `yearlyLimit` DOUBLE NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LeaveYear_name_key`(`name`),
    INDEX `LeaveYear_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Leave_yearId_idx` ON `Leave`(`yearId`);

-- CreateIndex
CREATE INDEX `LeaveBalance_yearId_idx` ON `LeaveBalance`(`yearId`);

-- CreateIndex
CREATE UNIQUE INDEX `LeaveBalance_userId_yearId_key` ON `LeaveBalance`(`userId`, `yearId`);

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_yearId_fkey` FOREIGN KEY (`yearId`) REFERENCES `LeaveYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_yearId_fkey` FOREIGN KEY (`yearId`) REFERENCES `LeaveYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
