export default function Loading() {
  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-4xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-200" />
      </div>
    </main>
  );
}
