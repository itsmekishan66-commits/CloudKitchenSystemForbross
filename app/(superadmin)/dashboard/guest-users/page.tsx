import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import GuestUsersClient from "./client";

const GuestUsersPage = async () => {
  // Permission check
  await requirePermission(PERMISSIONS.VIEW_GUEST_USERS);

  return <GuestUsersClient />;
};

export default GuestUsersPage;
