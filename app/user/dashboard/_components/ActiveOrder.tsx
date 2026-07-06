import { Clock, CookingPot, Truck, CheckCircle, Package } from "lucide-react";

type OrderItem = {
  title: string;
  quantity: number;
};

type ActiveOrderType = {
  id: number;
  status: string;
  items: OrderItem[];
  total: string;
  createdAt: string | Date;
} | null;

function getStatusInfo(status: string) {
  switch (status) {
    case "Pending":
      return { label: "Order Placed", icon: Clock, progress: 25, color: "bg-yellow-500" };
    case "Preparing":
      return { label: "Preparing", icon: CookingPot, progress: 50, color: "bg-orange-500" };
    case "Out For Delivery":
      return { label: "On The Way", icon: Truck, progress: 75, color: "bg-blue-500" };
    case "Delivered":
      return { label: "Delivered", icon: CheckCircle, progress: 100, color: "bg-green-500" };
    default:
      return { label: status, icon: Package, progress: 0, color: "bg-gray-500" };
  }
}

export default function ActiveOrder({ order }: { order: ActiveOrderType }) {
  if (!order) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-800 text-center">
        <Package size={48} className="mx-auto text-zinc-600 mb-4" />
        <h2 className="font-bold text-xl mb-2 text-white">Active Order</h2>
        <p className="text-zinc-400">No active orders right now</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6">
      <h2 className="font-bold text-xl mb-4 text-white">Active Order</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl p-4">
          <div className="w-12 h-12 rounded-xl bg-orange-900/50 flex items-center justify-center">
            <statusInfo.icon size={24} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">
              {order.items.map((i) => i.title).join(", ")}
            </p>
            <p className="text-sm text-zinc-400">#{order.id}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-zinc-300">{statusInfo.label}</span>
            <span className="text-zinc-400">Rs.{order.total}</span>
          </div>

          <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${statusInfo.color}`}
              style={{ width: `${statusInfo.progress}%` }}
            />
          </div>

          <div className="flex justify-between mt-2">
            {["Placed", "Prep", "Delivery", "Done"].map((step, i) => (
              <div
                key={step}
                className={`text-xs ${
                  statusInfo.progress >= (i + 1) * 25
                    ? "text-orange-400 font-medium"
                    : "text-zinc-600"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
