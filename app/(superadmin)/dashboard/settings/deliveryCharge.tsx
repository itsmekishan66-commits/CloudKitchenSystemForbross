"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/lib/permission-context";
type Zone = {
    id: number;
    landmarkName: string;
    deliveryCharge: string;
    minOrderAmount: string | null;
    isActive: boolean;
};

const cardClass = "bg-white rounded-2xl shadow-sm border border-gray-100 p-6";
const inputClass ="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export default function DeliveryZonesClient() {
    const permissions = usePermissions();
    const can = (p: string) => permissions.includes(p);

    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Zone | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);

    const [form, setForm] = useState({
        landmarkName: "",
        deliveryCharge: "",
        minOrderAmount: "",
        isActive: true,
    });

    async function loadZones() {
        try {
            const res = await fetch("/api/delivery-zones?admin=true");
            const data = await res.json();
            if (data.zones) setZones(data.zones);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const fetch_zones = async () => {
            await loadZones();
        };
        fetch_zones();
    }, []);

    function openCreateModal() {
        setEditing(null);
        setForm({ landmarkName: "", deliveryCharge: "", minOrderAmount: "", isActive: true });
        setShowModal(true);
    }

    function openEditModal(zone: Zone) {
        setEditing(zone);
        setForm({
            landmarkName: zone.landmarkName,
            deliveryCharge: zone.deliveryCharge,
            minOrderAmount: zone.minOrderAmount ?? "",
            isActive: zone.isActive,
        });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.landmarkName.trim() || !form.deliveryCharge.trim()) return;
        setSaving(true);

        try {
            let res;
            if (editing) {
                res = await fetch(`/api/delivery-zones/${editing.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landmarkName: form.landmarkName,
                        deliveryCharge: form.deliveryCharge,
                        minOrderAmount: form.minOrderAmount || null,
                        isActive: form.isActive,
                    }),
                });
            } else {
                res = await fetch("/api/delivery-zones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landmarkName: form.landmarkName,
                        deliveryCharge: form.deliveryCharge,
                        minOrderAmount: form.minOrderAmount || null,
                    }),
                });
            }

            if (!res.ok) throw new Error("Failed to save delivery zone");
            setShowModal(false);
            loadZones();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    // async function handleToggle(zone: Zone) {
    //     try {
    //         const res = await fetch(`/api/delivery-zones/${zone.id}`, {
    //             method: "PATCH",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ action: "toggle" }),
    //         });
    //         if (!res.ok) throw new Error("Failed to toggle zone");
    //         loadZones();
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }

    function handleDelete(zone: Zone) {
        setDeleteTarget(zone);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/delivery-zones/${deleteTarget.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete zone");
            setDeleteTarget(null);
            loadZones();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Delivery Zones</h1>
                    <p className="mt-2 text-gray-500">
                        Manage delivery areas and their charges
                    </p>
                </div>
                {can("CREATE_SETTINGS") && (
                    <button onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"
                    >
                        + Add Zone
                    </button>
                )}
            </div>

            <div className={cardClass}>
                {zones.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No delivery zones configured yet.{can("CREATE_SETTINGS") ? " Click \"Add Zone\" to create one." : ""}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-3 font-medium">Landmark Name</th>
                                    <th className="pb-3 font-medium">Delivery Charge</th>
                                    <th className="pb-3 font-medium">Min. Order (Free Delivery)</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    {(can("UPDATE_SETTINGS") || can("DELETE_SETTINGS")) && (
                                        <th className="pb-3 font-medium text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {zones.map((zone) => (
                                    <tr key={zone.id} className="border-b last:border-0">
                                        <td className="py-4 font-medium">{zone.landmarkName}</td>
                                        <td className="py-4">Rs. {Number(zone.deliveryCharge).toFixed(2)}</td>
                                        <td className="py-4">
                                            {zone.minOrderAmount
                                                ? `Rs. ${Number(zone.minOrderAmount).toFixed(2)}`
                                                : "—"}
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${zone.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {zone.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        {(can("UPDATE_SETTINGS") || can("DELETE_SETTINGS")) && (
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {can("UPDATE_SETTINGS") && (
                                                        <button onClick={() => openEditModal(zone)}
                                                            className="rounded-md px-4 py-1 text-white bg-blue-600"
                                                            title="Edit">Edit
                                                        </button>
                                                    )}
                                                    {can("DELETE_SETTINGS") && (
                                                        <button onClick={() => handleDelete(zone)}
                                                            className="rounded-md px-4 py-1 text-white bg-red-500"
                                                            title="Delete">Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">
                            {editing ? "Edit Zone" : "Add Zone"}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Landmark Name
                                </label>
                                <input
                                    value={form.landmarkName}
                                    onChange={(e) => setForm({ ...form, landmarkName: e.target.value })}
                                    placeholder="e.g. Biratnagar"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Delivery Charge (Rs.)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.deliveryCharge}
                                    onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                                    placeholder="e.g. 50"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Min. Order for Free Delivery (optional)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.minOrderAmount}
                                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                                    placeholder="e.g. 500"
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Leave empty to always charge delivery fee
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <div className="flex gap-3">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={form.isActive === true}
                                            onChange={() => setForm({ ...form, isActive: true })}
                                            className="h-4 w-4 accent-orange-500"
                                        />
                                        <span className="text-sm">Active</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={form.isActive === false}
                                            onChange={() => setForm({ ...form, isActive: false })}
                                            className="h-4 w-4 accent-orange-500"
                                        />
                                        <span className="text-sm">Inactive</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.landmarkName.trim() || !form.deliveryCharge.trim()}
                                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editing ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation popup */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-2">Delete Zone</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deleteTarget.landmarkName}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}