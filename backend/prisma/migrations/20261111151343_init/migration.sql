-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `nim` VARCHAR(30) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `department` VARCHAR(100) NOT NULL DEFAULT 'Teknik Informatika',
    `weeklyMetsTarget` INTEGER NOT NULL DEFAULT 1500,
    `postureBaselineJson` JSON NULL,
    `pushSubscription` JSON NULL,
    `currentStreakDays` INTEGER NOT NULL DEFAULT 0,
    `xpPoints` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_nim_key`(`nim`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SedentarySession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `slouchCount` INTEGER NOT NULL DEFAULT 0,
    `tooCloseCount` INTEGER NOT NULL DEFAULT 0,
    `avgNeckRatio` DOUBLE NOT NULL DEFAULT 1.0,
    `breakCompleted` BOOLEAN NOT NULL DEFAULT false,
    `breakDurationMins` INTEGER NOT NULL DEFAULT 0,
    `verificationSource` ENUM('WEB_SENSOR_API', 'POSE_CAMERA_AI', 'MANUAL_LOG') NOT NULL DEFAULT 'POSE_CAMERA_AI',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SedentarySession_userId_startTime_idx`(`userId`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhysicalActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `activityDate` DATE NOT NULL,
    `intensityType` ENUM('WALKING', 'MODERATE', 'VIGOROUS', 'MUSCLE_STRENGTHENING', 'ACUTE_AEROBIC_RELIEF') NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `stepsCount` INTEGER NOT NULL DEFAULT 0,
    `avgCadenceSpm` INTEGER NOT NULL DEFAULT 0,
    `calculatedMets` DOUBLE NOT NULL,
    `source` ENUM('WEB_SENSOR_API', 'POSE_CAMERA_AI', 'MANUAL_LOG') NOT NULL DEFAULT 'WEB_SENSOR_API',
    `notes` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhysicalActivity_userId_activityDate_idx`(`userId`, `activityDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyWellbeingLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `logDate` DATE NOT NULL,
    `sleepHours` DOUBLE NOT NULL,
    `sleepQualityScore` INTEGER NOT NULL,
    `nonAcademicScreenHours` DOUBLE NOT NULL DEFAULT 0.0,
    `pss4RawAnswersJson` JSON NOT NULL,
    `pss4TotalScore` INTEGER NOT NULL,
    `totalSedentaryHours` DOUBLE NOT NULL DEFAULT 0.0,
    `totalMvpaMinutes` INTEGER NOT NULL DEFAULT 0,
    `mvpaPerSedentaryRatio` DOUBLE NOT NULL DEFAULT 0.0,
    `triadPillarsMet` INTEGER NOT NULL DEFAULT 0,
    `stressRiskLevel` ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE') NOT NULL DEFAULT 'LOW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DailyWellbeingLog_userId_logDate_key`(`userId`, `logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClinicalAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `instrumentType` VARCHAR(191) NOT NULL DEFAULT 'PSS_10',
    `rawAnswersJson` JSON NOT NULL,
    `totalScore` INTEGER NOT NULL,
    `severityLevel` ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE') NOT NULL,
    `notes` TEXT NULL,

    INDEX `ClinicalAssessment_userId_assessmentDate_idx`(`userId`, `assessmentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiCoachingInsight` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dominantMediator` VARCHAR(80) NOT NULL,
    `diagnosisSummary` TEXT NOT NULL,
    `isotemporalActionPlan` TEXT NOT NULL,
    `recommendedMetsToday` INTEGER NOT NULL,
    `scientificCitationNote` VARCHAR(255) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `AiCoachingInsight_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SedentarySession` ADD CONSTRAINT `SedentarySession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhysicalActivity` ADD CONSTRAINT `PhysicalActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyWellbeingLog` ADD CONSTRAINT `DailyWellbeingLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClinicalAssessment` ADD CONSTRAINT `ClinicalAssessment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiCoachingInsight` ADD CONSTRAINT `AiCoachingInsight_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
