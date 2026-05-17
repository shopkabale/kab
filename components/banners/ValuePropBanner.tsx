export default function ValuePropBanner() {
  return (
    // Removed bottom border and rounded corners to stack flush with the hero
    <div className="relative w-full bg-white dark:bg-[#151515] sm:rounded-t-xl border-x border-t border-slate-200 dark:border-slate-800 py-3 px-4 shadow-sm overflow-hidden z-10">
      
      {/* BACKGROUND EMOJIS (Scattered & Randomly Rotated) */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.04] dark:opacity-[0.06] text-2xl md:text-4xl overflow-hidden">
        <span className="absolute top-1 left-2 md:left-8 transform rotate-12">📱</span>
        <span className="absolute -bottom-2 left-1/4 transform -rotate-45">💻</span>
        <span className="absolute top-2 left-[40%] md:left-1/3 transform rotate-90">🎧</span>
        <span className="absolute -bottom-2 left-1/2 transform -rotate-12">⌚</span>
        <span className="absolute top-0 right-1/3 transform rotate-45 hidden sm:block">📺</span>
        <span className="absolute bottom-1 right-1/4 transform -rotate-90">🔋</span>
        <span className="absolute top-1 right-4 md:right-8 transform -rotate-[30deg]">📷</span>
        <span className="absolute top-4 right-[15%] transform rotate-180 hidden md:block">🕹️</span>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        
        {/* Main Headline */}
        <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-2">
          Kabale's Premium Tech Hub
        </h1>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-500/10 text-[#FF6A00] text-[10px]">⚡</span> 
            Affordable Tech
          </div>
          
          <span className="hidden sm:block text-slate-300 dark:text-slate-700">•</span>
          
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100 dark:bg-green-500/10 text-[#25D366] text-[10px]">✓</span> 
            Fast Delivery
          </div>
          
          <span className="hidden sm:block text-slate-300 dark:text-slate-700">•</span>
          
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-500 text-[10px]">🤝</span> 
            Pay on Arrival
          </div>
        </div>

      </div>
    </div>
  );
}
