START TRANSACTION;

CREATE TABLE IF NOT EXISTS `leaveyear` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 0,
  `yearlyLimit` DOUBLE NOT NULL DEFAULT 30,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LeaveYear_name_key` (`name`),
  KEY `LeaveYear_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leaveyear` (`name`, `startDate`, `endDate`, `isActive`, `yearlyLimit`, `createdAt`)
SELECT
  `years`.`year_name`,
  STR_TO_DATE(CONCAT(`years`.`year_name`, '-01-01'), '%Y-%m-%d'),
  STR_TO_DATE(CONCAT(`years`.`year_name`, '-12-31'), '%Y-%m-%d'),
  0,
  30,
  CURRENT_TIMESTAMP(3)
FROM (
  SELECT DISTINCT CAST(`year` AS CHAR) AS `year_name` FROM `leavebalance`
  UNION
  SELECT DISTINCT CAST(YEAR(`fromDate`) AS CHAR) AS `year_name` FROM `leave`
) AS `years`
WHERE
  `years`.`year_name` REGEXP '^[0-9]{4}$'
  AND NOT EXISTS (
    SELECT 1
    FROM `leaveyear` ly
    WHERE CAST(ly.`name` AS UNSIGNED) = CAST(`years`.`year_name` AS UNSIGNED)
  );

INSERT INTO `leaveyear` (`name`, `startDate`, `endDate`, `isActive`, `yearlyLimit`, `createdAt`)
SELECT
  CAST(YEAR(UTC_DATE()) AS CHAR),
  STR_TO_DATE(CONCAT(YEAR(UTC_DATE()), '-01-01'), '%Y-%m-%d'),
  STR_TO_DATE(CONCAT(YEAR(UTC_DATE()), '-12-31'), '%Y-%m-%d'),
  0,
  30,
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `leaveyear` WHERE CAST(`name` AS UNSIGNED) = YEAR(UTC_DATE())
);

SET @has_leave_yearId := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leave' AND COLUMN_NAME = 'yearId'
);
SET @sql_leave_yearId := IF(
  @has_leave_yearId = 0,
  'ALTER TABLE `leave` ADD COLUMN `yearId` INT NULL',
  'SELECT 1'
);
PREPARE stmt_leave_yearId FROM @sql_leave_yearId;
EXECUTE stmt_leave_yearId;
DEALLOCATE PREPARE stmt_leave_yearId;

SET @has_leavebalance_yearId := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leavebalance' AND COLUMN_NAME = 'yearId'
);
SET @sql_leavebalance_yearId := IF(
  @has_leavebalance_yearId = 0,
  'ALTER TABLE `leavebalance` ADD COLUMN `yearId` INT NULL',
  'SELECT 1'
);
PREPARE stmt_leavebalance_yearId FROM @sql_leavebalance_yearId;
EXECUTE stmt_leavebalance_yearId;
DEALLOCATE PREPARE stmt_leavebalance_yearId;

UPDATE `leave` l
JOIN `leaveyear` ly
  ON CAST(ly.`name` AS UNSIGNED) = YEAR(l.`fromDate`)
SET l.`yearId` = ly.`id`
WHERE l.`yearId` IS NULL;

UPDATE `leavebalance` lb
JOIN `leaveyear` ly
  ON CAST(ly.`name` AS UNSIGNED) = lb.`year`
SET lb.`yearId` = ly.`id`
WHERE lb.`yearId` IS NULL;

UPDATE `leaveyear` SET `isActive` = 0;
UPDATE `leaveyear`
SET `isActive` = 1
WHERE CAST(`name` AS UNSIGNED) = YEAR(UTC_DATE());

SET @has_active_year := (SELECT COUNT(*) FROM `leaveyear` WHERE `isActive` = 1);
SET @fallback_active_id := (
  SELECT `id`
  FROM `leaveyear`
  ORDER BY CAST(`name` AS UNSIGNED) DESC, `id` DESC
  LIMIT 1
);

UPDATE `leaveyear`
SET `isActive` = IF(`id` = @fallback_active_id, 1, `isActive`)
WHERE @has_active_year = 0;

UPDATE `leave` l
JOIN (
  SELECT `id` FROM `leaveyear` WHERE `isActive` = 1 ORDER BY `createdAt` DESC LIMIT 1
) ay
SET l.`yearId` = ay.`id`
WHERE l.`yearId` IS NULL;

UPDATE `leavebalance` lb
JOIN (
  SELECT `id` FROM `leaveyear` WHERE `isActive` = 1 ORDER BY `createdAt` DESC LIMIT 1
) ay
SET lb.`yearId` = ay.`id`
WHERE lb.`yearId` IS NULL;

SET @has_leave_year_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leave' AND INDEX_NAME = 'Leave_yearId_idx'
);
SET @sql_leave_year_idx := IF(
  @has_leave_year_idx = 0,
  'ALTER TABLE `leave` ADD INDEX `Leave_yearId_idx` (`yearId`)',
  'SELECT 1'
);
PREPARE stmt_leave_year_idx FROM @sql_leave_year_idx;
EXECUTE stmt_leave_year_idx;
DEALLOCATE PREPARE stmt_leave_year_idx;

SET @has_leavebalance_year_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leavebalance' AND INDEX_NAME = 'LeaveBalance_year_idx'
);
SET @sql_leavebalance_year_idx := IF(
  @has_leavebalance_year_idx = 0,
  'ALTER TABLE `leavebalance` ADD INDEX `LeaveBalance_year_idx` (`year`)',
  'SELECT 1'
);
PREPARE stmt_leavebalance_year_idx FROM @sql_leavebalance_year_idx;
EXECUTE stmt_leavebalance_year_idx;
DEALLOCATE PREPARE stmt_leavebalance_year_idx;

SET @has_leavebalance_yearId_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leavebalance' AND INDEX_NAME = 'LeaveBalance_yearId_idx'
);
SET @sql_leavebalance_yearId_idx := IF(
  @has_leavebalance_yearId_idx = 0,
  'ALTER TABLE `leavebalance` ADD INDEX `LeaveBalance_yearId_idx` (`yearId`)',
  'SELECT 1'
);
PREPARE stmt_leavebalance_yearId_idx FROM @sql_leavebalance_yearId_idx;
EXECUTE stmt_leavebalance_yearId_idx;
DEALLOCATE PREPARE stmt_leavebalance_yearId_idx;

SET @has_user_yearId_unique := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leavebalance'
    AND INDEX_NAME = 'LeaveBalance_userId_yearId_key'
);
SET @sql_user_yearId_unique := IF(
  @has_user_yearId_unique = 0,
  'ALTER TABLE `leavebalance` ADD UNIQUE KEY `LeaveBalance_userId_yearId_key` (`userId`, `yearId`)',
  'SELECT 1'
);
PREPARE stmt_user_yearId_unique FROM @sql_user_yearId_unique;
EXECUTE stmt_user_yearId_unique;
DEALLOCATE PREPARE stmt_user_yearId_unique;

SET @has_leave_year_fk := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leave'
    AND CONSTRAINT_NAME = 'Leave_yearId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_leave_year_fk := IF(
  @has_leave_year_fk = 0,
  'ALTER TABLE `leave` ADD CONSTRAINT `Leave_yearId_fkey` FOREIGN KEY (`yearId`) REFERENCES `leaveyear` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_leave_year_fk FROM @sql_leave_year_fk;
EXECUTE stmt_leave_year_fk;
DEALLOCATE PREPARE stmt_leave_year_fk;

SET @has_leavebalance_year_fk := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leavebalance'
    AND CONSTRAINT_NAME = 'LeaveBalance_yearId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_leavebalance_year_fk := IF(
  @has_leavebalance_year_fk = 0,
  'ALTER TABLE `leavebalance` ADD CONSTRAINT `LeaveBalance_yearId_fkey` FOREIGN KEY (`yearId`) REFERENCES `leaveyear` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_leavebalance_year_fk FROM @sql_leavebalance_year_fk;
EXECUTE stmt_leavebalance_year_fk;
DEALLOCATE PREPARE stmt_leavebalance_year_fk;

ALTER TABLE `leave` MODIFY `yearId` INT NOT NULL;
ALTER TABLE `leavebalance` MODIFY `yearId` INT NOT NULL;

COMMIT;
