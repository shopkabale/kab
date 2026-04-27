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

export default async function ServiceDetailsPage({ params }: { params: { id: string } }) {
  const docRef = doc(db, "products", params.id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    notFound();
  }

  const service = { id: snap.id, ...snap.data() } as any;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">

        {/* BREADCRUMBS */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          <Link href="/" className="hover:text-[#D97706] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/category/repairs-services" className="hover:text-[#D97706] transition-colors">Services</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[250px]">{service.title}</span>
        </div>

        {/* HERO BANNER: TRUE FULL WIDTH & NATURAL HEIGHT */}
        <div className="w-full bg-black rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl mb-10 border border-slate-200 dark:border-slate-800 flex justify-center">
          <Image 
            src={mainImage} 
            alt={service.title} 
            width={0}
            height={0}
            sizes="100vw"
            priority 
            // This is the magic formula: 100% width, height calculates automatically, max 85vh so it doesn't take 3 scrolls on desktop
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
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-[1.1]">
                {service.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-[#111] rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Service Provider</span>
                    <span className="text-slate-900 dark:text-white font-bold text-base">{service.sellerName || "Verified Expert"}</span>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-slate-800"></div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center border border-green-100 dark:border-green-900/30">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Platform Safety</span>
                    <span className="text-slate-900 dark:text-white font-bold text-base">Protected Booking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#D97706]" />
                Service Overview
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300 font-medium text-[15px] sm:text-base">
                  {service.description || "No specific details provided. Book the service to contact the provider for custom requirements."}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Revenue Lock */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-[#D97706] shadow-xl sticky top-24">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Booking Summary</h3>

              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                  <span>Est. Base Price</span>
                  <span className="text-slate-900 dark:text-white font-bold">UGX {basePrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-[#D97706] font-black text-lg sm:text-xl p-4 bg-amber-50 dark:bg-[#D97706]/10 rounded-xl sm:rounded-2xl border border-amber-200 dark:border-[#D97706]/30 shadow-inner">
                  <span className="text-sm">Deposit Required</span>
                  <span>UGX {commitmentDeposit.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500 font-medium text-sm pt-5 border-t border-slate-100 dark:border-slate-800">
                  <span>Pay Later (To Provider)</span>
                  <span className="font-bold">UGX {remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              <Link 
                href={`/service/${service.id}/checkout`} 
                className="w-full bg-[#D97706] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[15px] sm:text-base uppercase tracking-wide hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-6 active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                Pay Deposit to Book
              </Link>

              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Secure your booking instantly.</span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">Provider's WhatsApp unlocks immediately after payment.</span>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
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
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8 sm:mb-10 flex items-center gap-3">
              <Wrench className="w-7 h-7 text-[#D97706]" />
              Other Services You Might Need
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {relatedServices.map((relService) => {
                const relImg = relService.images?.[0] || "/placeholder.png";
                const relPrice = Number(relService.price).toLocaleString();

                return (
                  <Link 
                    href={`/service/${relService.id}`} 
                    key={relService.id}
                    className="flex flex-col bg-white dark:bg-[#151515] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#D97706] hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Related Post image uses a tall portrait ratio to look good in the grid */}
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
                      <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-[#D97706] transition-colors leading-tight">
                        {relService.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-0">
                          {relService.sellerName?.split(" ")[0] || "Expert"}
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#D97706]">
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
