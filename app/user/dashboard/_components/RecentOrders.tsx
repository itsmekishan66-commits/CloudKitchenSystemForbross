import { Package } from "lucide-react";

type OrderItem = {
  title: string;
  quantity: number;
};

type Order = {
  id: number;
  status: string;
  total: string;
  createdAt: string | Date;
  items: OrderItem[];
};

function getStatusStyle(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Preparing":
      return "bg-yellow-100 text-yellow-700";
    case "Out For Delivery":
      return "bg-blue-100 text-blue-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="font-bold text-xl mb-2 text-gray-900">Recent Orders</h2>
        <p className="text-gray-400">No orders yet. Start ordering your favorite meals!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-gray-900">Recent Orders</h2>
        <span className="text-sm text-gray-400">{orders.length} orders</span>
      </div>

      <div className="space-y-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Package size={20} className="text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {order.items.map((i) => i.title).join(", ")}
                </h4>
                <p className="text-sm text-gray-400">
                  #{order.id} • {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">Rs.{order.total}</p>
              <span
                className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${getStatusStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
