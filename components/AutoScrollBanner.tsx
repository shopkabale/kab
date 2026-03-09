export default function AutoScrollBanner() {
  return (
    <div className="overflow-hidden whitespace-nowrap bg-slate-900 text-[#D97706] py-3 rounded-xl border border-slate-800 shadow-sm relative flex items-center mb-6">
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>

      <div className="inline-block animate-marquee">
        <span className="mx-4 font-bold text-xs sm:text-sm uppercase tracking-widest">
          The better way to buy and sell in Kabale and the greater Kigezi community • Fast Delivery • 100% Cash on Delivery
        </span>
        <span className="mx-4 font-bold text-xs sm:text-sm uppercase tracking-widest">
          The better way to buy and sell in Kabale and the greater Kigezi community • Fast Delivery • 100% Cash on Delivery
        </span>
      </div>
    </div>
  );
}
