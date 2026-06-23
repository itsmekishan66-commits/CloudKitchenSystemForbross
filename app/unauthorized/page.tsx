export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">401 Unauthorized</h1>
      <p className="mt-3 text-center text-red-600">You are not authorized to access this page.</p>
      <p className="mt-3 text-center text-red-600">Contact your administrator, if you believe this is a mistake and you belong to this page.</p>
    </div>
  );
}