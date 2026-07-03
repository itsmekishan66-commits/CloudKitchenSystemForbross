"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function OffersPopup() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <style>{`@keyframes breathe { 0%, 100% { transform: scale(1.4); } 50% { transform: scale(1.06); } }`}</style>
            <span className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setOpen(true)}
                    className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-300"
                    style={{ animation: "breathe 2.5s ease-in-out infinite" }}
                >
                    🏷️ Offers
                </button>
            </span>

            {open && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60">
                    <div className="relative w-[80vw] h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-lg">Offer details coming soon...</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
