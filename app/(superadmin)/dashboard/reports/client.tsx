"use client";
import { CircleArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  totalMenuItems: number;
  statusBreakdown: Array<{ status: string; count: number; revenue: number }>;
  popularItems: Array<{ title: string; totalQuantity: number; totalRevenue: number }>;
}

export default function ReportsClient() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [downloadType, setDownloadType] = useState("");

  const handleDownload = (value: string) => {
    setDownloadType(value);
    switch (value) {
      case "pdf":
        window.location.href = "/api/download/pdf";
        console.log("pdf downloaded");
        break;

      case "csv":
        window.location.href = "/api/download/csv";
        console.log("csv downloaded");
        break;

      case "excel":
        window.location.href = "/api/download/excel";
        console.log("excel downloaded");
        break;
    }
  };


  useEffect(() => {
    fetch("/api/superadmin/reports")
      .then((res) => res.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  if (!data) {
    return <div className="rounded-xl bg-white p-6 text-red-600 shadow">Failed to load report data</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center justify-end gap-4">
          <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select value={downloadType} onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold mt-2">{data.totalOrders.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">Rs.{data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500 text-sm">Avg Order Value</p>
          <p className="text-3xl font-bold mt-2">Rs.{data.avgOrderValue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <p className="text-3xl font-bold mt-2">{data.totalCustomers.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {data.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-gray-700">{s.status}</span>
                <div className="flex gap-4">
                  <span className="font-semibold">{s.count} orders</span>
                  <span className="text-gray-500">Rs.{s.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {data.statusBreakdown.length === 0 && <p className="text-gray-400 text-sm">No data available</p>}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold mb-4">Popular Menu Items</h2>
          <div className="space-y-3">
            {data.popularItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-700">{item.title}</span>
                <div className="flex gap-4">
                  <span className="font-semibold">{item.totalQuantity} sold</span>
                  <span className="text-gray-500">Rs.{item.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {data.popularItems.length === 0 && <p className="text-gray-400 text-sm">No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}