"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileFormProps = {
  user: {
    name: string;
    phone: string | null;
    address: string | null;
  };
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    address: user.address ?? "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setMessage(response.ok ? "Profile updated." : "Unable to update profile.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        required
        className="w-full rounded-xl border p-3"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <input
        className="w-full rounded-xl border p-3"
        placeholder="Phone"
        value={form.phone}
        onChange={(event) => setForm({ ...form, phone: event.target.value })}
      />
      <textarea
        className="w-full rounded-xl border p-3"
        placeholder="Address"
        rows={3}
        value={form.address}
        onChange={(event) => setForm({ ...form, address: event.target.value })}
      />
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      <button className="rounded-xl bg-red-900 px-5 py-3 text-white">
        Save Profile
      </button>
    </form>
  );
}
