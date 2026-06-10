import CheckoutForm from "./checkoutForm";

export default function CheckoutPage() {
  return (
    <main className="max-w-4xl mx-auto py-24 px-6">

      <h1 className="text-4xl font-bold mb-10">
        Checkout
      </h1>

      <CheckoutForm />

    </main>
  );
}