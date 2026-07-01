"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo } from "react";
import useCart from "@/hooks/useCart";
import useUser from "@/hooks/useUser";
import PaymentMethods from "./paymentMethods";
import { User, Phone, MapPin, ShoppingBag, ChevronDown } from "lucide-react";

type Zone = {
  id: number;
  landmarkName: string;
  deliveryCharge: string;
  minOrderAmount: string | null;
};

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

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    streetAddress: "",
  });

  // Fetch active delivery zones
  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) {
          setZones(data.zones);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({
            customerName: data.user.name || "",
            phone: data.user.phone || "",
            streetAddress: data.user.address || "",
          });
        }
      })
      .catch(() => { });
  }, [user]);

  // Derive delivery charge from selected zone
  const deliveryCharge = useMemo(() => {
    if (!selectedZoneId) return 0;
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (!zone) return 0;
    const charge = Number(zone.deliveryCharge);
    if (zone.minOrderAmount && totalPrice >= Number(zone.minOrderAmount)) {
      return 0;
    }
    return charge;
  }, [selectedZoneId, zones, totalPrice]);

  const grandTotal = totalPrice + deliveryCharge;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setError("");

      if (!form.customerName.trim() || !form.phone.trim() || !form.streetAddress.trim()) {
        setError("Name, phone, and address are required.");
        return;
      }

      if (!selectedZoneId) {
        setError("Please select a delivery landmark.");
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
            address: form.streetAddress,
            zoneId: selectedZoneId,
            deliveryCharge,
            paymentMethod,
            items,
            total: grandTotal,
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
    [form, items, grandTotal, deliveryCharge, selectedZoneId, paymentMethod, clearCart, router],
  );

  const showGuestModal = !userLoading && !user;

  const addressSection = (
    <>
      <div className="relative">
        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <select
          required
          value={selectedZoneId ?? ""}
          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm appearance-none"
          onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select Delivery landmark</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.landmarkName} — Rs.{Number(zone.deliveryCharge).toFixed(2)}
              {zone.minOrderAmount && ` (Free above Rs.${Number(zone.minOrderAmount).toFixed(2)})`}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
        <textarea
          required
          placeholder="your exact street address, house number, apartment, etc."
          value={form.streetAddress}
          rows={3}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
          onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
        />
      </div>

      {selectedZoneId && (
        <div className="flex justify-between items-center text-sm px-1">
          <span className="text-gray-600">Delivery Charge</span>
          <span className="font-medium">
            {deliveryCharge === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `Rs. ${deliveryCharge.toFixed(2)}`
            )}
          </span>
        </div>
      )}

      {selectedZoneId && (
        <div className="flex justify-between items-center font-bold text-base px-1 pt-2 border-t">
          <span>Total</span>
          <span>Rs. {grandTotal.toFixed(2)}</span>
        </div>
      )}
    </>
  );

  const formFields = (
    <>
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

      {addressSection}
    </>
  );

  const guestModal = (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="relative bg-linear-to-r from-orange-500 to-red-600 p-6 text-white">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold">Complete Your Order</h2>
          <p className="text-white/80 text-sm mt-1">Enter your details to place the order</p>
        </div>

        <div className="p-6 space-y-4">
          {formFields}

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
                Place Order — Rs.{grandTotal.toFixed(2)}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="border-2 w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition"
          >
            Cancel
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
          {formFields}
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
              Place Order — Rs.{grandTotal.toFixed(2)}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="border-2 border-gray-800 rounded-3xl w-full text-center text-md text-red-800 hover:text-black py-3 transition"
        >
          Cancel Order
        </button>
      </form>
    </>
  );
}