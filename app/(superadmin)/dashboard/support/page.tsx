import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import SupportClient from "./client";

const SupportPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_SUPPORTS);

  return <SupportClient />;
};

export default SupportPage;
