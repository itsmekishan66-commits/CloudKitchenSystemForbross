import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import SuppliersClient from "./client";

const SuppliersPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_SUPPLIERS);
  return <SuppliersClient />;
};

export default SuppliersPage;
