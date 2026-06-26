"use client";
// import { CircleArrowDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

interface SupportTicket {
  id: number;
  userId: number | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
}

export default function SupportClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  
  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };



  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter((t) => t.subject.toLowerCase().includes(q) || (t.assignedTo ?? "").toLowerCase().includes(q));
  }, [tickets, search]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/support");
      const data = await res.json();
      if (!data.error) setTickets(data.tickets ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadTickets);
  }, [loadTickets]);

  async function updateStatus(id: number, status: string) {
    try {
      const res = await fetch("/api/superadmin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setMessage("Ticket updated");
      await loadTickets();
    } catch {
      setMessage("Failed to update ticket");
    }
  }

  const statusColors: Record<string, string> = {
    Open: "bg-blue-100 text-blue-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    Closed: "bg-gray-100 text-gray-500",
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-gray-100 text-gray-600",
    Medium: "bg-blue-100 text-blue-600",
    High: "bg-orange-100 text-orange-600",
    Urgent: "bg-red-100 text-red-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
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

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Subject</th>
              <th className="p-4 text-left">Priority</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Assigned To</th>
              <th className="p-4 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No support tickets found</td></tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t">
                  <td className="p-4">#{ticket.id}</td>
                  <td className="p-4 font-medium">{ticket.subject}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${priorityColors[ticket.priority] ?? ""}`}>{ticket.priority}</span>
                  </td>
                  <td className="p-4">
                    {can("UPDATE_SUPPORTS") ? (
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                    ) : (
                    <span className={`rounded-full px-3 py-1 text-sm ${statusColors[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {ticket.status}
                    </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{ticket.assignedTo ?? "-"}</td>
                  <td className="p-4 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}