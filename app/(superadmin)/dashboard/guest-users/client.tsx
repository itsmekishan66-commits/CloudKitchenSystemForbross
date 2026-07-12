"use client";
import { CircleArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/lib/permission-context";

interface GuestUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isGuest: boolean;
  createdAt: string;
}

export default function GuestUsersClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [users, setUsers] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  //to download the file
   const handleDownload = (type: string) => {
    if (type) {
      window.open(`/api/exports/${type}?source=guest-users`, "_blank");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q) || (u.address ?? "").toLowerCase().includes(q));
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const start = (page - 1) * perPage;
  const visibleUsers = filteredUsers.slice(start, start + perPage);

  useEffect(() => {
    fetch("/api/users?isGuest=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setUsers(data.users ?? []);
        }
      })
      .catch(() => setError("Unable to load guest users."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 text-red-600 shadow">{error}</div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Guest Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            Users who placed orders without creating an account
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-3 overflow-x-auto">
          {can("DOWNLOAD_GUEST_USERS") && (
          <button className=" flex gap-2 rounded-xl bg-orange-500 px-2 py-2 md:px-5 md:py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
            <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
              <option className="text-black" value="">Export</option>
              <option className="text-black" value="pdf">PDF</option>
              <option className="text-black" value="csv">CSV</option>
              <option className="text-black" value="excel">Excel</option>
            </select>
          </button>
          )}
          <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            Total: {users.length}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
           value={search}
           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
           placeholder="Search guest users..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div className="rounded-xl bg-white shadow overflow-x-auto no-scrollbar">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Address</th>
              <th className="p-4 text-left whitespace-nowrap">Placed On</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No guest users found
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-500">{user.phone ?? "-"}</td>
                  <td className="p-4 text-gray-500">{user.address ?? "-"}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({filteredUsers.length} guest users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}