ALTER TABLE `comment`
  ADD COLUMN `momentId` INT NULL AFTER `collectionId`,
  ADD COLUMN `ipLocation` VARCHAR(191) NULL AFTER `status`,
  ADD COLUMN `userAgent` VARCHAR(512) NULL AFTER `ipLocation`,
  ADD COLUMN `browser` VARCHAR(96) NULL AFTER `userAgent`,
  ADD COLUMN `os` VARCHAR(96) NULL AFTER `browser`;

CREATE INDEX `Comment_momentId_idx`
  ON `comment` (`momentId`);

ALTER TABLE `comment`
  ADD CONSTRAINT `Comment_momentId_fkey`
  FOREIGN KEY (`momentId`) REFERENCES `about_segment`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
