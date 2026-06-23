"use client";
import { CircleArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { FiTrash2, FiMail, FiPhone, FiMessageSquare } from "react-icons/fi";
// import { FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

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
  const [messages, setMessages] = useState<Message[]>([]);
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
    if (!confirm("Delete this message?")) return;
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
    <div className="m-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-500 mt-1">
            Messages from the contact form and newsletter subscriptions
          </p>
        </div>
        <div className="flex items-center justify-end gap-4">
          <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select value={downloadType} onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
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
          {messages.map((msg) => (
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

                <button
                  onClick={() => handleDelete(msg.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-4"
                  title="Delete"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}