"use client";

import { useState } from "react";
import type { Order, OrderItem } from "@/db/schemas/orders";
import Pagination from "@/app/_components/Pagination";

type OrderWithItems = Pick<
  Order,
  | "id"
  | "status"
  | "total"
  | "paymentMethod"
  | "deliveryCharge"
  | "discountAmount"
  | "dueAmount"
  | "createdAt"
> & {
  items: Pick<OrderItem, "id" | "title" | "quantity" | "price">[];
};

const PER_PAGE = 20;

const statusStyles: Record<string, string> = {
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Preparing: "bg-blue-100 text-blue-700",
};

export default function OrderHistory({ orders }: { orders: OrderWithItems[] }) {
  const [page, setPage] = useState(1);

  // Page is clamped so the slice never renders empty while Pagination's own
  // correction effect catches up.
  const totalPages = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const visibleOrders = orders.slice(
    (currentPage - 1) * PER_PAGE,
    (currentPage - 1) * PER_PAGE + PER_PAGE
  );

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5">
      <h3 className="font-semibold text-sm mb-4">Order History ({orders.length})</h3>
      {visibleOrders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">#{order.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      statusStyles[order.status] ?? "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Rs.{order.total}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Payment: {order.paymentMethod} &middot; Delivery: Rs.
                  {order.deliveryCharge}
                </p>
                {Number(order.discountAmount) > 0 && (
                  <p className="text-green-600">Discount: Rs.{order.discountAmount}</p>
                )}
                {Number(order.dueAmount) > 0 && (
                  <p className="text-amber-600">Due: Rs.{order.dueAmount}</p>
                )}
              </div>
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Items ({order.items.length})
                </summary>
                <div className="mt-1 space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs text-gray-600 pl-3"
                    >
                      <span>
                        {item.title} × {item.quantity}
                      </span>
                      <span>Rs.{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-gray-50">
        <Pagination
          total={orders.length}
          perPage={PER_PAGE}
          page={currentPage}
          onPage={setPage}
          label="Orders"
        />
      </div>
    </div>
  );
}
