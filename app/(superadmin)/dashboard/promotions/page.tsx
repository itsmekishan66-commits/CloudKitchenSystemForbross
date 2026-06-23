import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import PromotionsClient from "./client";

const PromotionsPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_PROMOTIONS);

  return <PromotionsClient />;
};

export default PromotionsPage;
