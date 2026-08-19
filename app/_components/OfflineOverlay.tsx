// "use client";

// import { useCallback, useEffect, useState } from "react";
// import { WifiOff, RefreshCw, Phone } from "lucide-react";

// export default function OfflineOverlay({
//   siteName,
//   contactPhone,
// }: {
//   siteName: string;
//   contactPhone: string;
// }) {
//   const [isOffline, setIsOffline] = useState(false);
//   const [checking, setChecking] = useState(false);

//   const checkConnection = useCallback(async () => {
//     if (!navigator.onLine) {
//       setIsOffline(true);
//       return false;
//     }
//     const controller = new AbortController();
//     const timer = setTimeout(() => {
//       controller.abort();
//     }, 8000);

//     try {
//       const res = await fetch("/api/health", {
//         cache: "no-store",
//         signal: controller.signal,
//       });
//       setIsOffline(!res.ok);
//       return res.ok;
//     } catch {
//       setIsOffline(true);
//       return false;
//     } finally {
//       clearTimeout(timer);
//     }
//   }, []);

//   useEffect(() => {
//     const id = setTimeout(() => {
//       void checkConnection();
//     }, 0);
//     return () => clearTimeout(id);
//   }, [checkConnection]);

//   useEffect(() => {
//     const handleReconnect = () => checkConnection();
//     window.addEventListener("online", handleReconnect);
//     window.addEventListener("offline", handleReconnect);
//     return () => {
//       window.removeEventListener("online", handleReconnect);
//       window.removeEventListener("offline", handleReconnect);
//     };
//   }, [checkConnection]);

//   useEffect(() => {
//     if (!isOffline) return;
//     const id = setInterval(() => checkConnection(), 5000);
//     return () => clearInterval(id);
//   }, [isOffline, checkConnection]);

//   useEffect(() => {
//     document.body.style.overflow = isOffline ? "hidden" : "";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOffline]);

//   const retry = async () => {
//     setChecking(true);
//     await checkConnection();
//     setChecking(false);
//   };

//   const displayPhone = contactPhone || "+977 9800000000";

//   if (!isOffline) return null;

//   return (
//     <div
//       className="fixed inset-0 z-9999 flex items-center justify-center bg-[#f6f4ef] p-6"
//       role="alert"
//       aria-live="assertive"
//     >
//       <div className="flex max-w-md flex-col items-center text-center">
//         <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#7f1d1d]/10">
//           <WifiOff className="size-10 text-[#7f1d1d]" />
//         </div>
//         <p className="text-sm font-semibold uppercase tracking-widest text-[#7f1d1d]">
//           {siteName}
//         </p>
//         <h1 className="mt-1 text-2xl font-bold text-[#111]">
//           You&apos;re offline
//         </h1>
//         <p className="mt-2 text-sm leading-relaxed text-gray-600">
//           It looks like you&apos;ve lost your internet connection. Please check
//           your Wi-Fi or mobile data and try again.
//         </p>
//         {displayPhone && (
//           <div className="mt-6 w-full rounded-xl border border-[#7f1d1d]/20 bg-white p-4">
//             <p className="text-sm font-semibold text-[#111]">
//               Need help urgently? Contact {siteName} administration
//             </p>

//             <a
//               href={`tel:${displayPhone}`}
//               className="mt-1 inline-flex items-center gap-2 text-[#7f1d1d]"
//             >
//               <Phone className="size-4" />
//               <span className="text-sm font-medium">{displayPhone}</span>
//             </a>
//           </div>
//         )}
//         <button
//           type="button"
//           onClick={retry}
//           disabled={checking}
//           className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#7f1d1d] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7f1d1d]/90 disabled:opacity-60"
//         >
//           <RefreshCw className={checking ? "size-4 animate-spin" : "size-4"} />
//           {checking ? "Checking…" : "Try again"}
//         </button>
//       </div>
//     </div>
//   );
// }