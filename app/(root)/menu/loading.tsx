export default function MenuLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-10 w-48 bg-gray-200 rounded-lg mb-8 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-md">
            <div className="h-64 bg-gray-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
