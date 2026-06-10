ALTER TABLE `about_segment`
  ADD COLUMN `kind` VARCHAR(32) NOT NULL DEFAULT 'about' AFTER `id`;

CREATE INDEX `AboutSegment_kind_visible_posttime_idx`
  ON `about_segment` (`kind`, `visible`, `posttime`);
