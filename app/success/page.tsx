import Link from "next/link";

export default function SuccessPage() {
  return (
    <main
      className="
      min-h-screen
      flex
      items-center
      justify-center
      px-6
    "
    >
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-600">Order Placed!</h1>

        <p className="mt-4 text-gray-600">Thank you for ordering.</p>

        <Link
          href="/"
          className="
          inline-block
          mt-8
          bg-red-900
          text-white
          px-8
          py-3
          rounded-xl
        "
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
