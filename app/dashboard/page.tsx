import Link from "next/link";

import LogoutButton from "../auth/LogoutButton";
import ProfileForm from "../user/ProfileForm";
import { getOrdersByUserId } from "@/db/services/orders";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await requireUser();
  const orders = await getOrdersByUserId(user.id);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-900">
              User Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/menu" className="rounded-xl bg-red-900 px-4 py-2 text-white">
              Order Food
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">Profile</h2>
            <div className="mt-5">
              <ProfileForm user={user} />
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">My Orders</h2>
            <div className="mt-5 overflow-x-auto">
              {orders.length === 0 ? (
                <p className="text-gray-600">No orders yet.</p>
              ) : (
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">Order</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-3">#{order.id}</td>
                        <td className="p-3">Rs.{order.total}</td>
                        <td className="p-3">{order.status}</td>
                        <td className="p-3">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
