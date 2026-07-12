export default function UserDashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3 animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
