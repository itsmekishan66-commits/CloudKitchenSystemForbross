import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-900">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold">Page not found</h1>
        <p className="mt-4 text-gray-600">
          The page you are looking for is not available.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-red-900 px-6 py-3 text-white"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
