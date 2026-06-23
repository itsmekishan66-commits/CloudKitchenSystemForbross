import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import CustomersClient from "./client";

const CustomersPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_USERS);

  return <CustomersClient />;
};

export default CustomersPage;
