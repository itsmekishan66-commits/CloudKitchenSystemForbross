ALTER TABLE `cooked_food_stock` DROP FOREIGN KEY `cooked_food_stock_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `cooked_food_stock` DROP COLUMN `category_id`;