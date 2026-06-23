import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import InventoryClient from "./client";

const InventoryPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);

  return <InventoryClient />;
};

export default InventoryPage;
