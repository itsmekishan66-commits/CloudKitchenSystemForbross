ALTER TABLE `supplier_products` ADD `purchase_unit` varchar(40) DEFAULT 'Carton';--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `units_per_pack` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD `sell_unit` varchar(40) DEFAULT 'Piece';