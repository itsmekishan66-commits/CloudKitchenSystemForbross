import { Landmark } from "lucide-react";
import QuickNav from "./_components/QuickNav";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 p-4 sm:p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Landmark size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Accounting
            </h1>
            <p className="text-gray-500 text-sm">
              Double-entry bookkeeping & financial statements
            </p>
          </div>
        </div>
      </div>

      <QuickNav />

      {children}
    </div>
  );
}
