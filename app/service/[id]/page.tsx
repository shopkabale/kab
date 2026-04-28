import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { notFound } from "next/navigation";
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  Info, 
  Lock,
  Wrench,
  Star
} from "lucide-react";

// ==========================================
// THE DUAL-LOOKUP ENGINE
// ==========================================
async function getServiceData(lookupId: string) {
  // 1. Try fetching by the Long Firebase ID first
  const docRef = doc(db, "products", lookupId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as any;
  }

  // 2. Fallback: Try fetching by the Short ID (publicId)
  const q = query(collection(db, "products"), where("publicId", "==", lookupId), limit(1));
  const qSnap = await getDocs(q);
  
  if (!qSnap.empty) {
    return { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as any;
  }

  // 3. Complete failure (dead link)
  return null;
}

// ==========================================
// DYNAMIC METADATA (Reads both link types)
// ==========================================
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const service = await getServiceData(params.id);

  if (!service) return { title: "Service Not Found" };

  return {
    title: `${service.title} | Kabale Online Services`,
    description: service.description || `Book ${service.title} provided by ${service.sellerName} on Kabale Online.`,
  };
}

// ==========================================
// MAIN PAGE RENDER
// ==========================================
export default async function ServiceDetailsPage({ params }: { params: { id: string } }) {
  
  // Fetch using the bulletproof engine
  const service = await getServiceData(params.id);

  if (!service) {
    notFound();
  }

  const mainImage = service.images?.[0] || "/placeholder.png";

  // ==========================================
  // FINANCIAL MATH (Enforcing 1,000 UGX Minimum)
  // ==========================================
  const basePrice = Number(service.price) || 0;
  const calculatedDeposit = Math.round(basePrice * 0.10); 
  const commitmentDeposit = calculatedDeposit < 1000 ? 1000 : calculatedDeposit; 
  const remainingBalance = Math.max(0, basePrice - commitmentDeposit);

  // 🔥 FETCH RELATED SERVICES
  const relatedQ = query(
    collection(db, "products"),
    where("category", "==", "services"),
    limit(4) 
  );
  const relatedSnap = await getDocs(relatedQ);
  const relatedServices = relatedSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(s => s.id !== service.id)
    .slice(0, 3); 

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 pt-4 font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">

        {/* BREADCRUMBS */}
        <div style={{ color: '#6B6B6B' }} className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 dark:text-slate-500">
          <Link href="/" className="hover:text-[#FF6A00] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/category/services" className="hover:text-[#FF6A00] transition-colors">Services</Link>
          <span>/</span>
          <span style={{ color: '#1A1A1A' }} className="dark:text-white truncate max-w-[150px] sm:max-w-[250px]">{service.title}</span>
        </div>

        {/* HERO BANNER: TRUE FULL WIDTH & NATURAL HEIGHT */}
        <div className="w-full bg-slate-100 dark:bg-[#121212] rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm mb-10 border border-slate-200 dark:border-slate-800 flex justify-center">
          <Image 
            src={mainImage} 
            alt={service.title} 
            width={0}
            height={0}
            sizes="100vw"
            priority 
            className="w-full h-auto max-h-[85vh] object-contain sm:object-cover"
          />
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Service Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header Card */}
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Verified Professional
                </span>
              </div>
              <h1 style={{ color: '#1A1A1A' }} className="text-3xl sm:text-4xl lg:text-5xl font-black dark:text-white tracking-tight mb-6 leading-[1.1]">
                {service.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm font-medium border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-[#111] rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span style={{ color: '#6B6B6B' }} className="text-[10px] uppercase tracking-wider font-bold mb-0.5 dark:text-slate-400">Service Provider</span>
                    <span style={{ color: '#1A1A1A' }} className="dark:text-white font-bold text-base">{service.sellerName || "Verified Expert"}</span>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-slate-800"></div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center border border-green-100 dark:border-green-900/30">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex flex-col">
                    <span style={{ color: '#6B6B6B' }} className="text-[10px] uppercase tracking-wider font-bold mb-0.5 dark:text-slate-400">Platform Safety</span>
                    <span style={{ color: '#1A1A1A' }} className="dark:text-white font-bold text-base">Protected Booking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 style={{ color: '#1A1A1A' }} className="text-lg font-black dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#FF6A00]" />
                Service Overview
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p style={{ color: '#6B6B6B' }} className="whitespace-pre-wrap leading-relaxed dark:text-slate-300 font-medium text-[15px] sm:text-base">
                  {service.description || "No specific details provided. Book the service to contact the provider for custom requirements."}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Revenue Lock */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-[#FF6A00] shadow-xl sticky top-24">
              <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black uppercase tracking-widest mb-6 text-center dark:text-slate-400">Booking Summary</h3>

              <div className="space-y-5 mb-8">
                <div style={{ color: '#6B6B6B' }} className="flex justify-between items-center font-medium dark:text-slate-400">
                  <span>Est. Base Price</span>
                  <span style={{ color: '#1A1A1A' }} className="dark:text-white font-bold">UGX {basePrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-[#FF6A00] font-black text-lg sm:text-xl p-4 bg-orange-50 dark:bg-[#FF6A00]/10 rounded-xl sm:rounded-2xl border border-orange-200 dark:border-[#FF6A00]/30 shadow-inner">
                  <span className="text-sm">Deposit Required</span>
                  <span>UGX {commitmentDeposit.toLocaleString()}</span>
                </div>

                <div style={{ color: '#6B6B6B' }} className="flex justify-between items-center font-medium text-sm pt-5 border-t border-slate-100 dark:border-slate-800">
                  <span>Pay Later (To Provider)</span>
                  <span style={{ color: '#1A1A1A' }} className="font-bold dark:text-white">UGX {remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              <Link 
                href={`/service/${service.publicId || service.id}/checkout`} 
                className="w-full bg-[#FF6A00] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[15px] sm:text-base uppercase tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-6 active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                Pay Deposit to Book
              </Link>

              <ul className="space-y-3.5">
                <li style={{ color: '#6B6B6B' }} className="flex items-start gap-3 text-xs sm:text-sm font-medium dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Secure your booking instantly.</span>
                </li>
                <li style={{ color: '#6B6B6B' }} className="flex items-start gap-3 text-xs sm:text-sm font-medium dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Provider's WhatsApp unlocks immediately after payment.</span>
                </li>
                <li style={{ color: '#6B6B6B' }} className="flex items-start gap-3 text-xs sm:text-sm font-medium dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Pay the remaining balance in cash after the job is done.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RELATED SERVICES SECTION */}
        {/* ========================================== */}
        {relatedServices.length > 0 && (
          <div className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-slate-200 dark:border-slate-800">
            <h2 style={{ color: '#1A1A1A' }} className="text-2xl sm:text-3xl font-black dark:text-white tracking-tight mb-8 sm:mb-10 flex items-center gap-3">
              <Wrench className="w-7 h-7 text-[#FF6A00]" />
              Other Services You Might Need
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {relatedServices.map((relService) => {
                const relImg = relService.images?.[0] || "/placeholder.png";
                const relPrice = Number(relService.price).toLocaleString();

                return (
                  <Link 
                    href={`/service/${relService.publicId || relService.id}`} 
                    key={relService.id}
                    className="flex flex-col bg-white dark:bg-[#151515] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#FF6A00] hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative w-full aspect-[4/5] bg-slate-50 dark:bg-black overflow-hidden border-b border-slate-100 dark:border-slate-800">
                      <Image
                        src={relImg}
                        alt={relService.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover z-10 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col flex-grow">
                      <h3 style={{ color: '#1A1A1A' }} className="text-sm sm:text-lg font-black dark:text-white line-clamp-2 mb-2 group-hover:text-[#FF6A00] transition-colors leading-tight">
                        {relService.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span style={{ color: '#6B6B6B' }} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-0">
                          {relService.sellerName?.split(" ")[0] || "Expert"}
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#FF6A00]">
                          UGX {relPrice}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
