import { redirect } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="flex">
                <Sidebar role={user.role} />
                <main className="flex-1 p-2 bg-gray-100 min-h-screen ml-68">

                    <div className="flex text-extrabold text-3xl ml-10 ">You are {user.role}</div>
                    {children}
                    <Toaster position="top-right" /> 
                </main>
            </div>
        </>

    );
}