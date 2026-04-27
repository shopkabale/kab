import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { notFound } from "next/navigation";
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Lock
} from "lucide-react";

// ==========================================
// DYNAMIC METADATA
// ==========================================
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const docRef = doc(db, "products", params.id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return { title: "Service Not Found" };

  const data = snap.data();
  return {
    title: `${data.title} | Kabale Online Services`,
    description: data.description || `Book ${data.title} provided by ${data.sellerName} on Kabale Online.`,
  };
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default async function ServiceDetailsPage({ params }: { params: { id: string } }) {
  const docRef = doc(db, "products", params.id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    notFound();
  }

  const service = { id: snap.id, ...snap.data() } as any;
  const mainImage = service.images?.[0] || "/placeholder.png";

  // The Financial Math
  const basePrice = Number(service.price) || 0;
  const commitmentDeposit = Math.round(basePrice * 0.10); // 10% Deposit
  const remainingBalance = basePrice - commitmentDeposit;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 pt-4 font-sans selection:bg-[#D97706] selection:text-white">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* BREADCRUMBS */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          <Link href="/" className="hover:text-[#D97706] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/category/repairs-services" className="hover:text-[#D97706] transition-colors">Services</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{service.title}</span>
        </div>

        {/* HERO BANNER (Landscape / Flyer friendly) */}
        <div className="w-full aspect-video sm:aspect-[21/9] bg-[#111] rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-lg mb-8 border border-slate-200 dark:border-slate-800">
          {/* Blurred Background to make non-wide images look premium */}
          <div className="absolute inset-0 opacity-40 blur-2xl">
            <Image src={mainImage} alt="blur bg" fill className="object-cover" />
          </div>
          {/* The Actual Flyer (Object Contain ensures no text is cropped) */}
          <Image 
            src={mainImage} 
            alt={service.title} 
            fill 
            className="object-contain z-10 p-2 sm:p-4"
            priority 
          />
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Service Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Area */}
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  Verified Service
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
                {service.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-[#111] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>Provider: <span className="text-slate-900 dark:text-white font-bold">{service.sellerName || "Verified Expert"}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Kabale Online Protected</span>
                </div>
              </div>
            </div>

            {/* Description Area */}
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#D97706]" />
                Service Overview
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300 font-medium text-[15px]">
                  {service.description || "No specific details provided. Book the service to contact the provider for custom requirements."}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Revenue Lock (Checkout Card) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border-2 border-[#D97706] shadow-xl sticky top-24">
              
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Booking Summary</h3>
              
              {/* Math Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                  <span>Est. Base Price</span>
                  <span>UGX {basePrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-[#D97706] font-black text-lg p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <span>10% Deposit To Book</span>
                  <span>UGX {commitmentDeposit.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500 dark:text-slate-500 font-medium text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span>Remaining Balance</span>
                  <span>UGX {remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* The Call To Action */}
              <Link 
                href={`/service/${service.id}/checkout`} // 🔥 We will build this in Phase 4!
                className="w-full bg-[#D97706] text-white py-4 rounded-xl font-black text-[15px] uppercase tracking-wide hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg mb-4 active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                Pay Deposit to Book
              </Link>

              {/* Trust Indicators to push conversion */}
              <ul className="space-y-3 mt-6">
                <li className="flex items-start gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Secure your booking instantly.</span>
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Provider's WhatsApp unlocks immediately after payment.</span>
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Pay the remaining balance in cash after the job is done.</span>
                </li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
