"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
import OrdersTable from "../../_components/OrdersTable";

interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  userId: number | null;
  customerName: string;
  phone: string;
  address: string;
  userEmail: string | null;
  isGuest: boolean;
  paymentMethod: string;
  total: string;
  deliveryCharge: string;
  status: string;
  paymentSettled?: number | null;
  createdAt: Date | string;
  items: OrderItem[];
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => o.customerName.toLowerCase().includes(q) || (o.phone ?? "").toLowerCase().includes(q) || (o.address ?? "").toLowerCase().includes(q) || String(o.id).includes(q));
  }, [orders, search]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data.orders ?? []);
        }
      })
      .catch(() => setError("Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 text-red-600 shadow">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center justify-end gap-4">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      <OrdersTable orders={filteredOrders} />
    </div>
  );
}