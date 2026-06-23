import Topbar from "./Topbar";
// import { requireAdmin } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100 lg:flex mt-4">
      {/* <Sidebar /> */}

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
