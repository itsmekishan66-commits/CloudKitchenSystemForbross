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
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 sm:space-y-5">
      <div>
        <label className="block mb-1.5 sm:mb-2 font-medium text-gray-300 text-sm sm:text-base">Full Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-orange-400 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      <div>
        <label className="block mb-1.5 sm:mb-2 font-medium text-gray-300 text-sm sm:text-base">Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-orange-400 placeholder-gray-400 text-sm sm:text-base"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block mb-1.5 sm:mb-2 font-medium text-gray-300 text-sm sm:text-base">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Order Inquiry"
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-orange-400 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      <div>
        <label className="block mb-1.5 sm:mb-2 font-medium text-gray-300 text-sm sm:text-base">Message *</label>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none resize-none focus:border-orange-400 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-red-900 hover:bg-orange-600 disabled:opacity-60 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center justify-center sm:justify-start gap-3 font-semibold transition w-full sm:w-auto text-sm sm:text-base"
      >
        <FaPaperPlane />
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
