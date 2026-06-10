"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useCart from "@/hooks/useCart";
import PaymentMethods from "./paymentMethods";

type OrderResponse = {
  error?: string;
  orderId?: number;
};

export default function CheckoutForm() {
  const router = useRouter();

  const { items, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          paymentMethod,
          items,
          subtotal: totalPrice,
          deliveryCharge: 100,
          total: totalPrice + 100,
        }),
      });

      const data = (await response.json()) as OrderResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to place order. Please try again.");
        return;
      }

      clearCart();
      router.push(`/success?orderId=${data.orderId ?? ""}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        required
        placeholder="Full Name"
        className="w-full border p-3 rounded-xl"
        onChange={(e) =>
          setForm({
            ...form,
            customerName: e.target.value,
          })
        }
      />

      <input
        required
        placeholder="Phone"
        className="w-full border p-3 rounded-xl"
        onChange={(e) =>
          setForm({
            ...form,
            phone: e.target.value,
          })
        }
      />

      <input
        required
        placeholder="Email"
        className="w-full border p-3 rounded-xl"
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value,
          })
        }
      />

      <textarea
        required
        placeholder="Delivery Address"
        className="w-full border p-3 rounded-xl"
        rows={4}
        onChange={(e) =>
          setForm({
            ...form,
            address: e.target.value,
          })
        }
      />

      <h3 className="font-semibold text-lg">Payment Method</h3>

      <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />

      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        disabled={loading}
        className="
        w-full
        bg-red-900
        text-white
        py-4
        rounded-xl
      "
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </form>
  );
}
