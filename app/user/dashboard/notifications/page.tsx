"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  CookingPot,
  Truck,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import Link from "next/link";

type Notification = {
  id: number;
  title: string;
  message: string;
  status: string;
  orderId: number;
  time: string;
};

function getStatusIcon(status: string) {
  switch (status) {
    case "Pending":
      return Clock;
    case "Preparing":
      return CookingPot;
    case "Out For Delivery":
      return Truck;
    case "Delivered":
      return CheckCircle;
    case "Cancelled":
      return XCircle;
    default:
      return Package;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Pending":
      return "text-yellow-500 bg-yellow-50";
    case "Preparing":
      return "text-orange-500 bg-orange-50";
    case "Out For Delivery":
      return "text-blue-500 bg-blue-50";
    case "Delivered":
      return "text-green-500 bg-green-50";
    case "Cancelled":
      return "text-red-500 bg-red-50";
    default:
      return "text-gray-500 bg-gray-50";
  }
}

function relativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/orders")
      .then((res) => res.json())
      .then((data) => {
        const orders = data.orders ?? [];
        const notifs: Notification[] = orders.map((order: { id: number; status: string; total: string; createdAt: string }) => ({
          id: order.id,
          title: `Order #${order.id} ${order.status}`,
          message: `Your order has been ${order.status.toLowerCase()}. Total: Rs. ${order.total}`,
          status: order.status,
          orderId: order.id,
          time: order.createdAt,
        }));
        setNotifications(notifs);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-400 mt-1">Stay updated on your order status</p>
        </div>
        {notifications.length > 0 && (
          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Bell size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Notifications</h2>
          <p className="text-gray-400">
            You&apos;ll see order updates here when you place orders
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getStatusIcon(notif.status);

            return (
              <Link
                key={notif.id}
                href="/user/dashboard/order"
                className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(notif.status)}`}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                      {notif.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      {relativeTime(notif.time)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      notif.status === "Delivered"
                        ? "bg-green-50 text-green-600"
                        : notif.status === "Cancelled"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {notif.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
