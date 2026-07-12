"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Plus, X, Clock, AlertCircle, CheckCircle2, CircleDot, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "@/utils/format";

interface SupportTicket {
  id: number;
  userId: number | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  resolutionNote: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null; phone: string | null; address: string | null } | null;
}

interface SupportReply {
  id: number;
  ticketId: number;
  userId: number | null;
  senderName: string | null;
  message: string;
  createdAt: string;
}

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

const statusMeta: Record<string, { color: string; icon: typeof CircleDot }> = {
  Open: { color: "bg-blue-500/15 text-blue-400", icon: CircleDot },
  "In Progress": { color: "bg-yellow-500/15 text-yellow-400", icon: Loader2 },
  Resolved: { color: "bg-green-500/15 text-green-400", icon: CheckCircle2 },
  Closed: { color: "bg-zinc-500/15 text-zinc-400", icon: AlertCircle },
};

const priorityMeta: Record<string, string> = {
  Low: "bg-zinc-500/15 text-zinc-300",
  Medium: "bg-blue-500/15 text-blue-400",
  High: "bg-orange-500/15 text-orange-400",
  Urgent: "bg-red-500/15 text-red-400",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Medium");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/user/support")
      .then((res) => res.json())
      .then((data) => {
        if (active && !data.error) setTickets(data.tickets ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to create ticket");
        return;
      }
      toast.success("Ticket raised successfully");
      setSubject("");
      setMessage("");
      setPriority("Medium");
      setFormOpen(false);
      const res2 = await fetch("/api/user/support");
      const data2 = await res2.json();
      if (!data2.error) setTickets(data2.tickets ?? []);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(ticket: SupportTicket) {
    setDetail(ticket);
    setReplies([]);
    setReplyText("");
    try {
      const res = await fetch(`/api/user/support/${ticket.id}/replies`);
      const data = await res.json();
      if (!data.error) setReplies(data.replies ?? []);
    } catch {
      // ignore
    }
  }

  async function sendReply() {
    if (!detail || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/user/support/${detail.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setReplyText("");
      const res2 = await fetch(`/api/user/support/${detail.id}/replies`);
      const data2 = await res2.json();
      if (!data2.error) setReplies(data2.replies ?? []);
    } catch {
      toast.error("Failed to send reply");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Support</h1>
          <p className="text-zinc-400 mt-1">Raise an issue and track its status</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold transition text-sm"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-800 text-center">
          <LifeBuoy size={64} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Tickets Yet</h2>
          <p className="text-zinc-400">Having an issue? Raise a ticket and our team will help you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const StatusIcon = statusMeta[ticket.status]?.icon ?? CircleDot;
            return (
              <button
                key={ticket.id}
                onClick={() => openDetail(ticket)}
                className="w-full text-left bg-zinc-900 rounded-2xl border border-zinc-800 p-4 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                      {ticket.subject}
                    </h4>
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{ticket.message}</p>
                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusMeta[ticket.status]?.color ?? "bg-zinc-500/15 text-zinc-400"}`}>
                      <StatusIcon size={12} />
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityMeta[ticket.priority] ?? "bg-zinc-500/15 text-zinc-400"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New ticket modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !saving && setFormOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Raise a Ticket</h2>
              <button
                onClick={() => !saving && setFormOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-orange-400 placeholder-zinc-500 text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300">Message *</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none resize-none focus:border-orange-400 placeholder-zinc-500 text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-orange-400 text-sm"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setFormOpen(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{detail.subject}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusMeta[detail.status]?.color ?? "bg-zinc-500/15 text-zinc-400"}`}>
                    {detail.status}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityMeta[detail.priority] ?? "bg-zinc-500/15 text-zinc-400"}`}>
                    {detail.priority}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{detail.message}</p>

            {/* <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-zinc-800 p-4 text-sm">
              <div><span className="text-zinc-500">Name:</span> {detail.user?.name ?? "-"}</div>
              <div><span className="text-zinc-500">Phone:</span> {detail.user?.phone ?? "-"}</div>
              <div className="col-span-2"><span className="text-zinc-500">Email:</span> {detail.user?.email ?? "-"}</div>
              <div className="col-span-2"><span className="text-zinc-500">Address:</span> {detail.user?.address ?? "-"}</div>
            </div> */}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Conversation</h3>
              {replies.length === 0 ? (
                <p className="text-sm text-zinc-500">No replies yet. Our team will respond soon.</p>
              ) : (
                <div className="space-y-2">
                  {replies.map((r) => (
                    <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">{r.senderName ?? (r.userId ? `#${r.userId}` : "Support")}</span>
                        <span className="text-xs text-zinc-500">{formatDateTime(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.status === "Resolved" || detail.status === "Closed" ? (
              <p className="mt-4 text-sm text-zinc-500">
                This ticket is {detail.status}. For any further help, please create a new ticket.
              </p>
            ) : (
              <div className="mt-4 flex items-end gap-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2 text-sm outline-none resize-none focus:border-orange-400 placeholder-zinc-500"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
              <span>Ticket #{detail.id}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDateTime(detail.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
