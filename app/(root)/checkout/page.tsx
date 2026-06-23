import CheckoutForm from "./_components/checkoutForm";
import { ShoppingCart } from "lucide-react";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
            <ShoppingCart size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-400 mt-1">Almost there! Confirm your order details.</p>
          </div>
        </div>

        <CheckoutForm />
      </div>
    </main>
  );
}
