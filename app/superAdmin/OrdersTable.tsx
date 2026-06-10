"use client";

import { useState } from "react";

interface Order {
  id: number;
  customerName: string;
  total: string;
  status: string;
  createdAt: Date | string;
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [message, setMessage] = useState("");

  async function updateStatus(id: number, status: string) {
    setMessage("");

    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      setMessage("Unable to update order status.");
      return;
    }

    setMessage("Order status updated.");
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-gray-600 shadow">
        No orders found.
      </div>
    );
  }

  return (
    <>
      {message ? (
        <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Customer</th>

              <th className="p-4 text-left">Total</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4 text-left">Placed</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-4">{order.customerName}</td>

                <td className="p-4">Rs.{order.total}</td>

                <td className="p-4">
                  <select
                    defaultValue={order.status}
                    onChange={(event) =>
                      updateStatus(order.id, event.target.value)
                    }
                    className="border rounded px-3 py-1"
                  >
                    <option>Pending</option>

                    <option>Preparing</option>

                    <option>Out For Delivery</option>

                    <option>Delivered</option>

                    <option>Cancelled</option>
                  </select>
                </td>

                <td className="p-4">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
