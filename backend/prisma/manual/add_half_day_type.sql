SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leave'
    AND COLUMN_NAME = 'halfDayType'
);

SET @statement := IF(
  @column_exists = 0,
  'ALTER TABLE `leave` ADD COLUMN `halfDayType` ENUM(''first_half'',''second_half'') NULL AFTER `isHalfDay`',
  'SELECT "halfDayType column already exists"'
);

PREPARE stmt FROM @statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
