import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import SuccessTracker from "@/components/SuccessTracker"; // 🔥 IMPORT TRACKER

// This is a Server Component, so we can fetch data directly and securely
export default async function SuccessPage({ params }: { params: { orderId: string } }) {
  // 1. Fetch the exact order using the Firebase Document ID
  const orderSnap = await adminDb.collection("orders").doc(params.orderId).get();

  // 2. If the order doesn't exist, kick them back to the homepage
  if (!orderSnap.exists) {
    redirect("/");
  }

  const orderData = orderSnap.data()!;
  const safeOrderNumber = orderData.orderNumber || "KAB-PENDING";
  const safeTotal = Number(orderData.total) || 0;
  const buyerName = orderData.buyerName || "Customer";
  const productId = orderData.productId || "unknown_product";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50">

      {/* 🔥 INVISIBLE PURCHASE TRACKER FOR GOOGLE ADS */}
      <SuccessTracker 
        orderId={safeOrderNumber} 
        total={safeTotal} 
        items={[
          { 
            id: productId, 
            name: orderData.productName || "Ordered Item", 
            price: safeTotal 
          }
        ]} 
      />

      {/* Success Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-50"></div>
        <div className="relative w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-green-100 z-10">
          ✓
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 text-center tracking-tight">
        Order Placed Successfully!
      </h1>

      <p className="text-lg text-slate-600 mb-8 max-w-md text-center font-medium leading-relaxed">
        Great news, <strong className="text-slate-900">{buyerName}</strong>! The item has been reserved for you. The seller will call you shortly to arrange delivery in Kabale.
      </p>

      {/* Order Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 w-full max-w-md shadow-sm">
        <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Order Number</p>
          <p className="font-mono text-3xl font-black text-[#D97706] bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
            {safeOrderNumber}
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-slate-500">Payment Method:</span>
          <span className="text-sm font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">Cash on Delivery</span>
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
          <span className="font-bold text-slate-700">Amount to Pay:</span>
          <span className="text-xl font-black text-slate-900">UGX {safeTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Buyer Instructions */}
      <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div>
          <h4 className="text-amber-900 font-bold text-sm mb-1">What happens next?</h4>
          <ul className="text-amber-800 text-xs font-medium space-y-1.5 list-disc list-inside">
            <li>Keep your phone nearby. The seller will call to agree on a meeting point.</li>
            <li>Inspect the item carefully before handing over any cash.</li>
            <li>If the seller does not confirm within 36 hours, the reservation will expire.</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Link 
          href="/profile" 
          className="flex-1 bg-[#D97706] text-white px-6 py-4 rounded-xl font-bold text-center hover:bg-amber-600 transition-colors shadow-md active:scale-95"
        >
          Track My Order
        </Link>
        <Link 
          href="/" 
          className="flex-1 bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold text-center hover:border-slate-300 hover:bg-slate-50 transition-colors active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}
