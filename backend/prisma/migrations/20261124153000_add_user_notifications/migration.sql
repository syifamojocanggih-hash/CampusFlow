-- CreateTable
CREATE TABLE IF NOT EXISTS `UserNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(30) NOT NULL DEFAULT 'system',
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `actionTab` VARCHAR(40) NULL,
    `actionLabel` VARCHAR(80) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `logDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserNotification_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `UserNotification_userId_logDate_idx`(`userId`, `logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserNotification` ADD CONSTRAINT `UserNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

