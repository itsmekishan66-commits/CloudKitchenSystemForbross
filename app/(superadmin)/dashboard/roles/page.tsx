import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import RolesClient from "./client";

const RolesPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_ROLES);

  return <RolesClient />;
};

export default RolesPage;
 