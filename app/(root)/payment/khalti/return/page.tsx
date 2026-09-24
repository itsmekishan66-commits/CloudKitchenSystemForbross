"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Package, Home, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

type VerifyResult =
  | { ok: true; orderId: number }
  | { error: string };

function KhaltiReturnContent() {
  const searchParams = useSearchParams();
  const pidx = searchParams.get("pidx");
  const status = searchParams.get("status");

  const clearCart = useCartStore((state) => state.clearCart);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const attempted = useRef(false);

  useEffect(() => {
    // Khalti's return redirect is never trusted directly — the API
    // confirms the payment status with a server-side lookup.
    // All setState calls happen inside async callbacks; the "missing
    // pidx" case is handled as a render-time branch below, not here.
    if (attempted.current || !pidx) return;
    attempted.current = true;

    fetch("/api/payments/khalti/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidx }),
    })
      .then((res) => res.json())
      .then((res: VerifyResult) => {
        setResult(res);
        if ("ok" in res && res.ok) {
          clearCart();
        }
      })
      .catch(() => setResult({ error: "Unable to verify payment. Please contact support." }))
      .finally(() => setLoading(false));
  }, [pidx, clearCart]);

  // Missing pidx from the gateway — show the error directly (no effect state).
  if (!pidx) {
    return (
      <main className="min-h-screen bg-black/90 flex items-center justify-center px-4">
        <div className="bg-orange-50 rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle size={44} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Not Verified</h1>
          <p className="text-gray-400 mb-2">
            Your Khalti payment could not be verified.
          </p>
          <p className="text-sm text-red-500 mb-6">Missing payment reference from Khalti.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-md"
            >
              <ShoppingBag size={18} />
              Try Again
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Home size={18} />
              Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-6" />
          <h1 className="text-xl font-semibold text-gray-900">Verifying your payment…</h1>
          <p className="text-gray-400 mt-2 text-sm">Please wait while we confirm with Khalti.</p>
        </div>
      </main>
    );
  }

  // Narrow the union safely: TS doesn't carry `in` narrowing into ternary branches.
  let verified: { ok: true; orderId: number } | null = null;
  if (result && "ok" in result) verified = result;

  const success = verified !== null;
  const orderId = verified?.orderId;
  // A user-cancelled Khalti session is reported as an error by verify,
  // but should be presented as "cancelled", not "failed".
  const cancelled = !success && (status === "User canceled" || status === "Expired");

  return (
    <main className="min-h-screen bg-black/90 flex items-center justify-center px-4">
      <div className="bg-orange-50 rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            success ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {success ? (
            <CheckCircle size={44} className="text-green-500" />
          ) : (
            <XCircle size={44} className="text-red-500" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {success
            ? "Payment Successful!"
            : cancelled
              ? "Payment Cancelled"
              : "Payment Not Verified"}
        </h1>
        <p className="text-gray-400 mb-2">
          {success
            ? "Thank you — your Khalti payment has been confirmed."
            : cancelled
              ? "You cancelled the Khalti payment. You have not been charged."
              : "Your Khalti payment could not be verified."}
        </p>

        {success && orderId ? (
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-sm font-medium mb-6">
            <Package size={16} />
            Order #{orderId}
          </div>
        ) : null}

        {!success && result && "error" in result ? (
          <p className="text-sm text-red-500 mb-6">{result.error}</p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href={success ? "/menu" : "/checkout"}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-md"
          >
            <ShoppingBag size={18} />
            {success ? "Order More" : "Try Again"}
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Home size={18} />
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function KhaltiReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </main>
      }
    >
      <KhaltiReturnContent />
    </Suspense>
  );
}