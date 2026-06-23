"use client";

import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, Calendar, Banknote } from "lucide-react";

type Order = {
  id: number;
  total: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/orders")
      .then((res) => res.json())
      .then((data) => setPayments(data.orders ?? []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments.reduce((sum, p) => sum + Number(p.total), 0);
  const codCount = payments.filter((p) => p.paymentMethod === "COD").length;
  const onlineCount = payments.filter((p) => p.paymentMethod === "ONLINE").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }
  return (
    <div className="space-y-16 gap-5 flex flex-col items-center justify-center">
      NOT YET IMPLEMENTED THE PAYMENT
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">COMMING SOON........</h1>
    </div>
  );
};
// return (
//   <div className="space-y-6">
//     <div>
//       <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payment History</h1>
//       <p className="text-gray-400 mt-1">View your payment records and spending</p>
//     </div>

//     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//       <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
//             <IndianRupee  size={20} className="text-emerald-500" />
//           </div>
//           <div>
//             <p className="text-sm text-gray-400">Total Spent</p>
//             <p className="text-xl font-bold text-gray-900">RS.{totalSpent.toFixed(2)}</p>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
//             <Banknote size={20} className="text-blue-500" />
//           </div>
//           <div>
//             <p className="text-sm text-gray-400">Cash on Delivery</p>
//             <p className="text-xl font-bold text-gray-900">{codCount} orders</p>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
//             <CreditCard size={20} className="text-purple-500" />
//           </div>
//           <div>
//             <p className="text-sm text-gray-400">Online Payment</p>
//             <p className="text-xl font-bold text-gray-900">{onlineCount} orders</p>
//           </div>
//         </div>
//       </div>
//     </div>

//     {payments.length === 0 ? (
//       <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
//         <CreditCard size={64} className="mx-auto text-gray-200 mb-4" />
//         <h2 className="text-xl font-bold text-gray-900 mb-2">No Payment History</h2>
//         <p className="text-gray-400">Your payment records will appear here</p>
//       </div>
//     ) : (
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-100">
//                 <th className="text-left text-sm font-medium text-gray-400 p-4">Order</th>
//                 <th className="text-left text-sm font-medium text-gray-400 p-4">Date</th>
//                 <th className="text-left text-sm font-medium text-gray-400 p-4">Method</th>
//                 <th className="text-left text-sm font-medium text-gray-400 p-4">Status</th>
//                 <th className="text-right text-sm font-medium text-gray-400 p-4">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {payments.map((payment) => (
//                 <tr
//                   key={payment.id}
//                   className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
//                 >
//                   <td className="p-4 font-medium text-gray-900">#{payment.id}</td>
//                   <td className="p-4 text-sm text-gray-500">
//                     <div className="flex items-center gap-1.5">
//                       <Calendar size={14} />
//                       {new Date(payment.createdAt).toLocaleDateString()}
//                     </div>
//                   </td>
//                   <td className="p-4">
//                     <span
//                       className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${
//                         payment.paymentMethod === "COD"
//                           ? "bg-blue-50 text-blue-600"
//                           : "bg-purple-50 text-purple-600"
//                       }`}
//                     >
//                       {payment.paymentMethod === "COD" ? (
//                         <Banknote size={14} />
//                       ) : (
//                         <CreditCard size={14} />
//                       )}
//                       {payment.paymentMethod}
//                     </span>
//                   </td>
//                   <td className="p-4">
//                     <span
//                       className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
//                         payment.status === "Delivered"
//                           ? "bg-green-50 text-green-600"
//                           : payment.status === "Cancelled"
//                             ? "bg-red-50 text-red-600"
//                             : "bg-yellow-50 text-yellow-600"
//                       }`}
//                     >
//                       {payment.status}
//                     </span>
//                   </td>
//                   <td className="p-4 text-right font-semibold text-gray-900">
//                     RS.{payment.total}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     )}
//   </div>
//   );
// }
