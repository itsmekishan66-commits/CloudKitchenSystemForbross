import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import dynamic from "next/dynamic";

const AccountDetailClient = dynamic(() => import("./_client"));

export default async function AccountDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requirePermission(PERMISSIONS.VIEW_PAYMENTS);
  const { id } = await params;
  return <AccountDetailClient accountId={id} />;
}
