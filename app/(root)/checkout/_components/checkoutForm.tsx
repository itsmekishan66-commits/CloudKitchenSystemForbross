"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import useCart from "@/hooks/useCart";
import useUser from "@/hooks/useUser";
import PaymentMethods from "./paymentMethods";
import { User, Phone, MapPin, ShoppingBag } from "lucide-react";

type OrderResponse = {
  error?: string;
  orderId?: number;
};

export default function CheckoutForm() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
  });

  const [profileFetched, setProfileFetched] = useState(false);

  if (user && !profileFetched) {
    setProfileFetched(true);
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({
            customerName: data.user.name || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
          });
        }
      })
      .catch(() => {});
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setError("");

      if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) {
        setError("Name, phone, and address are required.");
        return;
      }

      if (items.length === 0) {
        setError("Your cart is empty.");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: form.customerName,
            phone: form.phone,
            address: form.address,
            paymentMethod,
            items,
            total: totalPrice,
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
    },
    [form, items, totalPrice, paymentMethod, clearCart, router],
  );

  const showGuestModal = !userLoading && !user;

  const guestModal = (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-orange-500 to-red-600 p-6 text-white">
          <h2 className="text-xl font-bold">Complete Your Order</h2>
          <p className="text-white/80 text-sm mt-1">Enter your details to place the order</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Full Name"
              value={form.customerName}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>

          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Phone Number"
              value={form.phone}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
            <textarea
              required
              placeholder="Delivery Address"
              value={form.address}
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <ShoppingBag size={18} />
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showGuestModal && guestModal}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-900">Delivery Details</h2>

          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Full Name"
              value={form.customerName}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>

          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              placeholder="Phone Number"
              value={form.phone}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
            <textarea
              required
              placeholder="Delivery Address"
              value={form.address}
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Payment Method</h2>
          <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <ShoppingBag size={20} />
              Place Order — Rs.{totalPrice.toFixed(2)}
            </>
          )}
        </button>
      </form>
    </>
  );
}


