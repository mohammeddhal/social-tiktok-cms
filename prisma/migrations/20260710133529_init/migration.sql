-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('MANAGER', 'PUBLISHER', 'PHOTOGRAPHER') NOT NULL DEFAULT 'PHOTOGRAPHER',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `photographerId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PENDING', 'UPLOADED', 'DELAYED') NOT NULL DEFAULT 'PENDING',
    `isPromotionDay` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `video_tasks_photographerId_date_key`(`photographerId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `photographerId` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `fileKey` TEXT NOT NULL,
    `originalFilename` VARCHAR(191) NOT NULL,
    `fileSize` BIGINT NULL,
    `notes` TEXT NULL,
    `storageStatus` ENUM('ACTIVE', 'DELETED_FROM_STORAGE') NOT NULL DEFAULT 'ACTIVE',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `videos_taskId_key`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_publish_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `videoId` VARCHAR(191) NOT NULL,
    `platform` ENUM('TIKTOK', 'SNAPCHAT') NOT NULL,
    `status` ENUM('PENDING', 'PUBLISHED', 'DELAYED_UNPUBLISHED') NOT NULL DEFAULT 'PENDING',
    `publisherId` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `social_publish_tasks_videoId_platform_key`(`videoId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `video_tasks` ADD CONSTRAINT `video_tasks_photographerId_fkey` FOREIGN KEY (`photographerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `video_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_photographerId_fkey` FOREIGN KEY (`photographerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_publish_tasks` ADD CONSTRAINT `social_publish_tasks_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_publish_tasks` ADD CONSTRAINT `social_publish_tasks_publisherId_fkey` FOREIGN KEY (`publisherId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
