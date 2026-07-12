"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Send } from "lucide-react";
import { usePermissions } from "@/lib/permission-context";
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
  updatedAt: string;
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

export default function SupportClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  // replies for the selected ticket
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [noteTarget, setNoteTarget] = useState<{ id: number; status: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  // create form
  const [formOpen, setFormOpen] = useState(false);
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formPriority, setFormPriority] = useState<(typeof PRIORITIES)[number]>("Medium");
  const [formUserId, setFormUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        String(t.userId ?? "").includes(q) ||
        (t.user?.name ?? "").toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const totalPages = Math.ceil(filteredTickets.length / perPage);
  const start = (page - 1) * perPage;
  const visibleTickets = filteredTickets.slice(start, start + perPage);

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

  async function updateStatus(id: number, status: string, note?: string) {
    try {
      const res = await fetch("/api/superadmin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          ...(note !== undefined ? { resolutionNote: note } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setMessage("Ticket updated");
      await loadTickets();
    } catch {
      setMessage("Failed to update ticket");
    }
  }

  function onStatusChange(id: number, status: string) {
    if (status === "Resolved" || status === "Closed") {
      setNoteTarget({ id, status });
      setNoteText("");
    } else {
      updateStatus(id, status);
    }
  }

  async function saveNote() {
    if (!noteTarget || !noteText.trim()) return;
    await updateStatus(noteTarget.id, noteTarget.status, noteText);
    setNoteTarget(null);
    setNoteText("");
  }

  async function openDetail(ticket: SupportTicket) {
    setSelected(ticket);
    setReplies([]);
    setReplyText("");
    try {
      const res = await fetch(`/api/superadmin/support/${ticket.id}/replies`);
      const data = await res.json();
      if (!data.error) setReplies(data.replies ?? []);
    } catch {
      // ignore
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/superadmin/support/${selected.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setReplyText("");
      const res2 = await fetch(`/api/superadmin/support/${selected.id}/replies`);
      const data2 = await res2.json();
      if (!data2.error) setReplies(data2.replies ?? []);
    } catch {
      setMessage("Failed to send reply");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      setMessage("Subject and message are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formSubject,
          message: formMessage,
          priority: formPriority,
          userId: formUserId.trim() ? Number(formUserId) : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setMessage("Ticket created");
      setFormOpen(false);
      setFormSubject("");
      setFormMessage("");
      setFormPriority("Medium");
      setFormUserId("");
      await loadTickets();
    } catch {
      setMessage("Failed to create ticket");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      const res = await fetch(`/api/superadmin/support?id=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setMessage(data.error); return; }
      setMessage("Ticket deleted");
      if (selected?.id === deleteId) setSelected(null);
      await loadTickets();
    } catch {
      setMessage("Failed to delete ticket");
    } finally {
      setDeleteId(null);
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Support Tickets</h1>
        <div className="flex items-center flex-wrap gap-3">
          {can("CREATE_SUPPORTS") && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-white text-sm font-semibold hover:bg-orange-600"
            >
              <Plus size={18} />
              New Ticket
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search tickets..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Subject</th>
              <th className="p-4 text-left">Priority</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Created</th>
              {can("DELETE_SUPPORTS") && <th className="p-4 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleTickets.length === 0 ? (
              <tr><td colSpan={can("DELETE_SUPPORTS") ? 8 : 7} className="p-8 text-center text-gray-400">No support tickets found</td></tr>
            ) : (
              visibleTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t cursor-pointer hover:bg-gray-50" onClick={() => openDetail(ticket)}>
                  <td className="p-4">#{ticket.id}</td>
                  <td className="p-4 font-medium">{ticket.subject}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-sm ${priorityColors[ticket.priority] ?? ""}`}>{ticket.priority}</span>
                  </td>
                  <td className="p-4">
                    {can("UPDATE_SUPPORTS") && ticket.status !== "Resolved" && ticket.status !== "Closed" ? (
                      <select
                        value={ticket.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onStatusChange(ticket.id, e.target.value)}
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
                  <td className="p-4 text-gray-500">{ticket.user?.name ?? (ticket.userId ? `#${ticket.userId}` : "-")}</td>
                  <td className="p-4 text-gray-500">{formatDate(ticket.createdAt)}</td>
                  {can("DELETE_SUPPORTS") && (
                    <td className="p-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(ticket.id); }}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete ticket"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filteredTickets.length} tickets)
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

      {/* Create ticket modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setFormOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">New Ticket</h2>
              <button onClick={() => !saving && setFormOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Subject *</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  rows={5}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none resize-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as (typeof PRIORITIES)[number])}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                >
                  {PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Customer ID</label>
                <input
                  type="number"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  placeholder="Optional (defaults to you)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setFormOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail + replies modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.subject}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm ${priorityColors[selected.priority] ?? ""}`}>{selected.priority}</span>
                  <span className={`rounded-full px-3 py-1 text-sm ${statusColors[selected.status] ?? "bg-gray-100 text-gray-500"}`}>{selected.status}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Ticket:</span> #{selected.id}</div>
              <div><span className="text-gray-500">User:</span> {selected.user?.name ?? (selected.userId ? `#${selected.userId}` : "Guest")}</div>
              <div><span className="text-gray-500">Email:</span> {selected.user?.email ?? "-"}</div>
              <div><span className="text-gray-500">Phone:</span> {selected.user?.phone ?? "-"}</div>
              <div className="col-span-2"><span className="text-gray-500">Address:</span> {selected.user?.address ?? "-"}</div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {selected.message}
            </div>

            {selected.resolutionNote && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800 whitespace-pre-wrap">
                <span className="font-semibold">Resolution Note:</span> {selected.resolutionNote}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Conversation</h3>
              {replies.length === 0 ? (
                <p className="text-sm text-gray-400">No replies yet.</p>
              ) : (
                <div className="space-y-2">
                  {replies.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{r.senderName ?? (r.userId ? `#${r.userId}` : "System")}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected.status === "Resolved" || selected.status === "Closed" ? (
              <p className="mt-4 text-sm text-gray-500">
                This ticket is {selected.status}. No further replies can be added.
              </p>
            ) : (
              can("UPDATE_SUPPORTS") && (
                <div className="mt-4 flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none resize-none focus:border-orange-400"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    <Send size={16} />
                    Reply
                  </button>
                </div>
              )
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Delete Ticket</h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution note modal */}
      {noteTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setNoteTarget(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">
              Add Resolution Note
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Please describe how this ticket was resolved before marking it as &ldquo;{noteTarget.status}&rdquo;.
            </p>
            <textarea
              rows={5}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="How was this issue resolved?"
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none resize-none focus:border-orange-400"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setNoteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!noteText.trim()}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                Save &amp; {noteTarget.status}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
