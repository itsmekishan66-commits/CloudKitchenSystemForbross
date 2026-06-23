import Menusearch from "./_components/Menusearch";
import MenuSidebar from "./_components/Menusidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-linear-to-br from-[#faf8f5] to-[#f4f1ed]">
            <MenuSidebar />
            <div className="flex-1 p-4 md:p-8 pt-24">
                <Menusearch />
                <main className="mt-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
