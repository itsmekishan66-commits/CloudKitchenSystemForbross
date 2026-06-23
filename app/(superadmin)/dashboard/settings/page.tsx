import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import SettingsClient from "./client";

const SettingsPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_SETTINGS);

  return <SettingsClient />;
};

export default SettingsPage;
