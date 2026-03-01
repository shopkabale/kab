import Link from "next/link";

export default function SuccessPage({ params }: { params: { orderId: string } }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mb-8 shadow-sm">
        ✓
      </div>
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 text-center tracking-tight">
        Order Placed Successfully!
      </h1>
      
      <p className="text-lg text-slate-600 mb-8 max-w-md text-center">
        Your order has been sent to the seller. They will contact you shortly using the phone number you provided to arrange delivery.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 w-full max-w-sm text-center">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">System Order ID</p>
        <p className="font-mono text-xl font-black text-primary">{params.orderId.slice(0, 10).toUpperCase()}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link 
          href="/profile" 
          className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-center hover:bg-sky-500 transition-colors shadow-md"
        >
          Track My Order
        </Link>
        <Link 
          href="/products" 
          className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-center hover:border-primary hover:text-primary transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}