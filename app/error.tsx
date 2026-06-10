"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-gray-600">
          Please retry the request. If it keeps happening, contact support.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-xl bg-red-900 px-6 py-3 text-white"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
