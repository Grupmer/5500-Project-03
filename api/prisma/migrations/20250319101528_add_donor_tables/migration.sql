-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatar` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Donation` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `donation_date` DATETIME(3) NOT NULL,
    `donation_type` VARCHAR(50) NULL,
    `payment_method` VARCHAR(100) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
    `campaign_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `is_anonymous` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Donation_donation_date_idx`(`donation_date`),
    INDEX `Donation_campaign_id_idx`(`campaign_id`),
    INDEX `Donation_event_id_idx`(`event_id`),
    INDEX `Donation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(20) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    INDEX `Tag_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donor` (
    `id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(255) NULL,
    `nick_name` VARCHAR(255) NULL,
    `last_name` VARCHAR(255) NULL,
    `organization_name` VARCHAR(255) NULL,
    `gender` VARCHAR(50) NULL,
    `age` INTEGER NULL,
    `email` VARCHAR(255) NULL,
    `phone_number` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` TEXT NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `country` VARCHAR(100) NULL,
    `registration_date` DATETIME(3) NULL,
    `last_donation_id` VARCHAR(191) NULL,
    `total_donation_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_donations_count` INTEGER NOT NULL DEFAULT 0,
    `anonymous_donation_preference` BOOLEAN NOT NULL DEFAULT false,
    `is_merged` BOOLEAN NOT NULL DEFAULT false,
    `is_company` BOOLEAN NOT NULL DEFAULT false,
    `merge_to_donor_id` VARCHAR(191) NULL,
    `contact_phone_type` VARCHAR(191) NULL,
    `phone_restrictions` VARCHAR(191) NULL,
    `email_restrictions` VARCHAR(191) NULL,
    `communication_restrictions` VARCHAR(191) NULL,
    `subscription_events_in_person` VARCHAR(191) NULL,
    `subscription_events_magazine` VARCHAR(191) NULL,
    `communication_preference` VARCHAR(191) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Donor_email_key`(`email`),
    INDEX `Donor_email_idx`(`email`),
    INDEX `Donor_phone_number_idx`(`phone_number`),
    INDEX `Donor_last_donation_id_idx`(`last_donation_id`),
    INDEX `Donor_is_company_idx`(`is_company`),
    INDEX `Donor_is_merged_idx`(`is_merged`),
    INDEX `Donor_merge_to_donor_id_idx`(`merge_to_donor_id`),
    INDEX `Donor_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donor_Donation` (
    `donor_id` VARCHAR(191) NOT NULL,
    `donation_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Donor_Donation_donor_id_idx`(`donor_id`),
    INDEX `Donor_Donation_donation_id_idx`(`donation_id`),
    PRIMARY KEY (`donor_id`, `donation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donor_Tag` (
    `donor_id` VARCHAR(191) NOT NULL,
    `tag_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Donor_Tag_donor_id_idx`(`donor_id`),
    INDEX `Donor_Tag_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`donor_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interest_Domain` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Interest_Domain_name_key`(`name`),
    INDEX `Interest_Domain_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donor_Interest_Domain` (
    `donor_id` VARCHAR(191) NOT NULL,
    `interest_domain_id` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Donor_Interest_Domain_donor_id_idx`(`donor_id`),
    INDEX `Donor_Interest_Domain_interest_domain_id_idx`(`interest_domain_id`),
    PRIMARY KEY (`donor_id`, `interest_domain_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Communication` (
    `id` VARCHAR(191) NOT NULL,
    `donor_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `direction` VARCHAR(20) NOT NULL,
    `subject` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `status` VARCHAR(50) NOT NULL,
    `communication_date` DATETIME(3) NOT NULL,
    `response_required` BOOLEAN NOT NULL DEFAULT false,
    `response_received` BOOLEAN NOT NULL DEFAULT false,
    `response_date` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Communication_donor_id_idx`(`donor_id`),
    INDEX `Communication_communication_date_idx`(`communication_date`),
    INDEX `Communication_type_idx`(`type`),
    INDEX `Communication_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Donor` ADD CONSTRAINT `Donor_last_donation_id_fkey` FOREIGN KEY (`last_donation_id`) REFERENCES `Donation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor` ADD CONSTRAINT `Donor_merge_to_donor_id_fkey` FOREIGN KEY (`merge_to_donor_id`) REFERENCES `Donor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Donation` ADD CONSTRAINT `Donor_Donation_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Donation` ADD CONSTRAINT `Donor_Donation_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `Donation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Tag` ADD CONSTRAINT `Donor_Tag_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Tag` ADD CONSTRAINT `Donor_Tag_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Interest_Domain` ADD CONSTRAINT `Donor_Interest_Domain_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donor_Interest_Domain` ADD CONSTRAINT `Donor_Interest_Domain_interest_domain_id_fkey` FOREIGN KEY (`interest_domain_id`) REFERENCES `Interest_Domain`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
