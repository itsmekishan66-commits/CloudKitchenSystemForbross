"use client";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FiMail, FiPhone, FiMessageSquare  } from "react-icons/fi";
import toast from "react-hot-toast";
import { usePermissions } from "@/lib/permission-context";
import { useConfirm } from "@/app/_components/ConfirmPopup";

interface Message {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  source: string;
  createdAt: string;
}

const sourceBadge: Record<string, string> = {
  contact: "bg-blue-100 text-blue-700",
  newsletter: "bg-green-100 text-green-700",
};

export default function MessagesClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const confirm = useConfirm();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const totalPages = Math.ceil(messages.length / perPage);
  const start = (page - 1) * perPage;
  const visibleMessages = messages.slice(start, start + perPage);

  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };



  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/messages");
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
      } else {
        toast.error(data.error || "Failed to load messages");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchMessages());
  }, []);

  const handleDelete = async (id: number) => {
    if (!await confirm("Delete this message?")) return;
    try {
      const res = await fetch("/api/superadmin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        toast.success("Message deleted");
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Messages from the contact form and newsletter subscriptions
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button> */}
        </div>
        {/* <button
          onClick={fetchMessages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button> */}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No messages yet</div>
      ) : (
        <div className="space-y-4">
          {visibleMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-800">
                      {msg.name || "Anonymous"}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${sourceBadge[msg.source] || "bg-gray-100 text-gray-700"}`}
                    >
                      {msg.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiMail size={14} />
                      {msg.email}
                    </span>
                    {msg.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone size={14} />
                        {msg.phone}
                      </span>
                    )}
                  </div>

                  {msg.subject && (
                    <p className="mt-2 text-sm font-medium text-gray-600">
                      <FiMessageSquare size={14} className="inline mr-1" />
                      {msg.subject}
                    </p>
                  )}

                  {msg.message && (
                    <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  )}
                </div>

                {can("DELETE_MESSAGES") && (
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="rounded text-red-500 text-sm ml-4"
                  >
                    <Trash2 size={22} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({messages.length} messages)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}