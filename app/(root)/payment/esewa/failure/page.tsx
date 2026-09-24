"use client";

import Link from "next/link";
import { Suspense } from "react";
import { XCircle, Home, ShoppingBag } from "lucide-react";

function EsewaFailureContent() {
  return (
    <main className="min-h-screen bg-black/90 flex items-center justify-center px-4">
      <div className="bg-orange-50 rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle size={44} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-400 mb-2">
          Your eSewa payment could not be completed. You have not been charged.
        </p>

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

export default function EsewaFailurePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </main>
      }
    >
      <EsewaFailureContent />
    </Suspense>
  );
}