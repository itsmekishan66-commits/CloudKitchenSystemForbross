import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import CategoriesClient from "./client";

const CategoriesPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_CATEGORIES);

  return <CategoriesClient />;
};

export default CategoriesPage;
