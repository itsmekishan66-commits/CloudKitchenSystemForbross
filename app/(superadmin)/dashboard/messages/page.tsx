import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import MessagesClient from "./client";

const MessagesPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_MESSAGES);

  return <MessagesClient />;
};

export default MessagesPage;
