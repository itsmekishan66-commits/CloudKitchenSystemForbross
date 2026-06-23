// import { requirePermission } from '@/lib/auth';
import {PERMISSIONS} from "@/lib/permissions";
import { requirePermission } from "@/lib/requirePermission";

const PaymentPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_PAYMENTS);

  return (
    <div className=" text-4xl text-bold flex min-h-screen flex-col items-center justify-center">
      comming soon.......
    </div>
  );
}

export default PaymentPage;
