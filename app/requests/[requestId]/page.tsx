import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: { requestId: string };
}

// 1. GENERATE DYNAMIC META TAGS FOR SOCIAL SHARING
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const docSnap = await adminDb.collection("item_requests").doc(params.requestId).get();
    
    if (!docSnap.exists) {
      return { title: "Request Not Found | Okay Notice" };
    }

    const data = docSnap.data();
    const formattedBudget = Number(data?.budget).toLocaleString();
    const title = `${data?.buyerName} is looking for: ${data?.itemNeeded}`;
    const description = `Budget: UGX ${formattedBudget}. Do you have this item in Kabale? Tap to message ${data?.buyerName} directly on Okay Notice!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.okaynotice.com/requests/${params.requestId}`,
        siteName: "Okay Notice",
        images: [{ url: "/og-image.jpg", width: 1200, height: 630 }], // Uses your default OG image
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    return { title: "Buyer Request | Okay Notice" };
  }
}

// 2. THE PAGE UI
export default async function SingleRequestPage({ params }: PageProps) {
  const docSnap = await adminDb.collection("item_requests").doc(params.requestId).get();

  if (!docSnap.exists) {
    notFound();
  }

  const req = docSnap.data();
  const dateStr = req?.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : "Recently";
  const whatsappLink = `https://wa.me/${req?.buyerPhone?.replace(/[^0-9]/g, '')}?text=Hi%20${req?.buyerName},%20I%20saw%20your%20request%20for%20"${req?.itemNeeded}"%20on%20Okay%20Notice.%20I%20have%20this%20item!`;

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 min-h-screen">
      <Link href="/requests" className="text-sm font-bold text-slate-500 hover:text-[#D97706] mb-8 inline-block">
        &larr; Back to all requests
      </Link>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <span className="text-xs font-black text-[#D97706] bg-amber-50 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
              {req?.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              {req?.itemNeeded}
            </h1>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl min-w-[150px] text-center">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Max Budget</p>
            <p className="font-black text-emerald-700 text-2xl">UGX {Number(req?.budget).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-600">
              {req?.buyerName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Requested by</p>
              <p className="text-lg font-bold text-slate-900">{req?.buyerName}</p>
              <p className="text-xs text-slate-400 mt-1">Posted on {dateStr}</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 text-center bg-[#25D366] text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md text-lg flex items-center justify-center gap-2"
          >
            💬 I Have This Item
          </a>
        </div>
      </div>
    </div>
  );
}