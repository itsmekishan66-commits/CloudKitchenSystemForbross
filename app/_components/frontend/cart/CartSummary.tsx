"use client";

import Link from "next/link";

interface CartSummaryProps {
  totalPrice: number;
  deliveryCharge?: number;
}

// export default function CartSummary({ totalPrice }: CartSummaryProps) {
// const deliveryCharge = 100;
// const grandTotal = totalPrice + deliveryCharge;
export default function CartSummary({
  totalPrice,
  deliveryCharge = 0,
}: CartSummaryProps) {
  const grandTotal = totalPrice + deliveryCharge;

  return (
    <div className="border-t pt-5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-600">Subtotal</span>

        <span className="font-medium">Rs. {totalPrice.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-600">Delivery Charge</span>
        <span className="font-medium">
          {deliveryCharge === 0 ? (
            <span className="text-green-600">delivery charge in next step</span>
          ) : (
            `Rs. ${deliveryCharge.toFixed(2)}`
          )}
        </span>
      </div>

      <div className="border-t my-4" />

      <div className="flex justify-between items-center text-lg font-bold">
        <span>Total</span>

        <span className="text-red-900">Rs. {grandTotal.toFixed(2)}</span>
      </div>

      {totalPrice > 0 ? (
        <Link
          href="/checkout"
          className="block w-full mt-5 bg-red-900 text-white text-center py-3 rounded-xl"
        >
          Proceed to Checkout
        </Link>
      ) : (
        <button
          disabled
          className="w-full mt-5 bg-gray-300 text-gray-500 py-3 rounded-xl cursor-not-allowed"
        >
          Cart is Empty
        </button>
      )}
    </div>
  );
}
