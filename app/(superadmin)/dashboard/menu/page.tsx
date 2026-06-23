import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import MenuClient from "./client";

const MenuPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_MENUS);

  return <MenuClient />;
};

export default MenuPage;
