export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-10 w-48 bg-gray-200 rounded-lg mb-8 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
