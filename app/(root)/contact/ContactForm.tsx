"use client";

import { useState, FormEvent } from "react";
import { FaPaperPlane } from "react-icons/fa";
import toast from "react-hot-toast";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }
      toast.success("Message sent successfully!");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="block mb-2 font-medium">Full Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Order Inquiry"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Message *</label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-orange-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-red-900 hover:bg-orange-600 disabled:opacity-60 text-white px-8 py-4 rounded-xl flex items-center gap-3 font-semibold transition"
      >
        <FaPaperPlane />
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
