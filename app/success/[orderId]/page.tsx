import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import SuccessTracker from "@/components/SuccessTracker"; // 🔥 IMPORT TRACKER
import { 
  CheckCircle2, 
  MessageCircle, 
  LockOpen,
  Phone
} from "lucide-react";

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
  
  // Backwards compatibility for old orders vs new unified cart
  const cartItems = orderData.cartItems || [];
  const productId = orderData.productId || cartItems[0]?.productId || "unknown_product";
  const productName = orderData.productName || cartItems[0]?.name || "Ordered Item";

  // 🔥 NEW DETECTION LOGIC: We check if the name includes "Booking Deposit"
  const serviceItem = cartItems.find((item: any) => item.name && item.name.includes("Booking Deposit"));
  const isServiceOrder = !!serviceItem;

  // Format the WhatsApp Number securely on the server
  let waLink = "";
  let displayPhone = "";
  if (isServiceOrder && serviceItem.sellerPhone) {
    displayPhone = serviceItem.sellerPhone;
    const cleanPhone = displayPhone.replace(/\D/g, "");
    const formattedWaPhone = cleanPhone.startsWith("0") ? `256${cleanPhone.slice(1)}` : cleanPhone;
    const waMessage = encodeURIComponent(`Hello! I just paid the deposit for your service (${serviceItem.name.replace("Booking Deposit: ", "")}) on Kabale Online. When can we schedule the meetup?`);
    waLink = `https://wa.me/${formattedWaPhone}?text=${waMessage}`;
  }

  // Determine Payment Method Display
  const paymentMethodDisplay = orderData.paymentStatus === "paid" || orderData.paymentMethod === "mobile_money" 
    ? "Mobile Money (Paid)" 
    : "Cash on Delivery";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50 dark:bg-[#0a0a0a] selection:bg-[#D97706] selection:text-white">

      {/* 🔥 INVISIBLE PURCHASE TRACKER FOR GOOGLE ADS */}
      <SuccessTracker 
        orderId={safeOrderNumber} 
        total={safeTotal} 
        items={cartItems.length > 0 ? cartItems : [
          { id: productId, name: productName, price: safeTotal }
        ]} 
      />

      {/* UNIVERSAL SUCCESS HEADER */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white dark:border-[#151515]">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
          Great news, <strong className="text-slate-900 dark:text-white">{buyerName}</strong>! 
          {isServiceOrder ? " Your provider is now unlocked." : " Your items are reserved."}
        </p>
      </div>

      {/* ========================================== */}
      {/* PATH A: SERVICE BOOKING REVEAL UI */}
      {/* ========================================== */}
      {isServiceOrder ? (
        <div className="w-full max-w-md bg-white dark:bg-[#151515] rounded-3xl border-2 border-[#D97706] shadow-xl overflow-hidden mb-8 animate-in fade-in zoom-in-95 duration-700 delay-150">
          
          <div className="bg-[#D97706] text-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <LockOpen className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Provider Unlocked</h2>
            <p className="text-amber-100 font-medium text-sm">Your deposit is secure. Contact your provider below.</p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="w-16 h-16 bg-slate-100 dark:bg-[#111] rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                <img src={serviceItem.image || "/placeholder.png"} alt="Service" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 line-clamp-2">{serviceItem.name.replace("Booking Deposit: ", "")}</h3>
                <p className="text-sm font-black text-[#D97706]">Deposit Paid: UGX {safeTotal.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 text-center">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-2">
                Direct Phone Number
              </p>
              <div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-wider mb-2">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#D97706]" />
                {displayPhone || "N/A"}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Remember to pay the remaining balance in cash after the service is completed.
              </p>
            </div>

            {waLink ? (
              <a 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-base sm:text-lg hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 text-center"
              >
                <MessageCircle className="w-6 h-6 shrink-0" />
                <span>Message Provider</span>
              </a>
            ) : (
              <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-bold text-center border border-slate-200 dark:border-slate-700">
                No WhatsApp Number Provided
              </div>
            )}
          </div>
        </div>
      ) : (

      /* ========================================== */
      /* PATH B: STANDARD PHYSICAL PRODUCT UI       */
      /* ========================================== */
        <>
          <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 mb-8 w-full max-w-md shadow-sm">
            <div className="flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Order Number</p>
              <p className="font-mono text-3xl font-black text-[#D97706] bg-amber-50 dark:bg-[#D97706]/10 px-4 py-2 rounded-lg border border-amber-100 dark:border-[#D97706]/20">
                {safeOrderNumber}
              </p>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Payment Method:</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">{paymentMethodDisplay}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total Amount:</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">UGX {safeTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Buyer Instructions */}
          <div className="w-full max-w-md bg-amber-50 dark:bg-[#D97706]/10 border border-amber-200 dark:border-[#D97706]/30 rounded-xl p-4 mb-8 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="text-amber-900 dark:text-amber-500 font-bold text-sm mb-1">What happens next?</h4>
              <ul className="text-amber-800 dark:text-amber-200/80 text-xs font-medium space-y-1.5 list-disc list-inside">
                <li>Keep your phone nearby. Our team will contact you to arrange delivery in Kabale.</li>
                <li>Inspect your items carefully upon arrival.</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* UNIVERSAL BOTTOM ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Link 
          href="/profile" 
          className="flex-1 bg-[#D97706] text-white px-6 py-4 rounded-xl font-bold text-center hover:bg-amber-600 transition-colors shadow-md active:scale-95"
        >
          Track My Order
        </Link>
        <Link 
          href="/" 
          className="flex-1 bg-white dark:bg-[#151515] border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-center hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#111] transition-colors active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}
