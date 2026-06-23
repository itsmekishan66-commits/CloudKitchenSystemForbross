"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Home, ShoppingBag } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-400 mb-2">Thank you for your order.</p>

        {orderId && (
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-sm font-medium mb-6">
            <Package size={16} />
            Order #{orderId}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-md"
          >
            <ShoppingBag size={18} />
            Order More
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
