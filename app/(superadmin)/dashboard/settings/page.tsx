import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import SettingsClient from "./client";
import DeliveryZonesClient from "./deliveryCharge";

const SettingsPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_SETTINGS);

  return (
    <>
      <SettingsClient />
      <DeliveryZonesClient />
    </>
  );
};

export default SettingsPage;
