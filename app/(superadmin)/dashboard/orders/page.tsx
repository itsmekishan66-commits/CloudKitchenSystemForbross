import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import OrdersClient from "./client";

const OrdersPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_ORDERS);

  return <OrdersClient />;
};

export default OrdersPage;
