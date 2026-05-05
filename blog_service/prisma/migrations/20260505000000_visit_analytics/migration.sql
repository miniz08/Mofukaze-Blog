-- CreateTable
CREATE TABLE `visit_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(191) NOT NULL,
    `articleId` INTEGER NULL,
    `articleTitle` VARCHAR(191) NULL,
    `visitorId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `referrer` VARCHAR(512) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VisitEvent_articleId_idx`(`articleId`),
    INDEX `VisitEvent_createdAt_idx`(`createdAt`),
    INDEX `VisitEvent_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_event` ADD CONSTRAINT `VisitEvent_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `article`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
