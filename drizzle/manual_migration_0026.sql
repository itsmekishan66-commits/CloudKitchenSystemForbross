-- Run this against your MySQL database BEFORE drizzle-kit push

-- 1. Drop the FK constraint that depends on the index
SET @fk_name = (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql = IF(@fk_name IS NOT NULL, CONCAT('ALTER TABLE `reviews` DROP FOREIGN KEY `', @fk_name, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Drop the unique index
ALTER TABLE `reviews` DROP INDEX `user_menu_item_idx`;

-- 3. Make userId nullable
ALTER TABLE `reviews` MODIFY COLUMN `user_id` int NULL;

-- 4. Add new columns
ALTER TABLE `reviews` ADD COLUMN `user_name` varchar(160) NULL;
ALTER TABLE `reviews` ADD COLUMN `user_avatar` varchar(2048) NULL;
