import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import KitchenClient from "./client";

const KitchenPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_KITCHENS);

  return <KitchenClient />;
};

export default KitchenPage;
