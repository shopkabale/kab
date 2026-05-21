export default function TrustBadges() {
  const badges = [
    {
      title: "Pay on Delivery",
      description: "Inspect first, pay later via Mobile Money or Cash.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: "Fast Local Delivery",
      description: "Swift delivery across Kabale and the Kigezi region.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: "100% Genuine",
      description: "Verified electronics and products from trusted vendors.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Easy Returns",
      description: "Hassle-free local support if anything goes wrong.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 mb-8 sm:mb-12">
      {/* Container with a subtle background and borders for a neat, enclosed look */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        
        {/* Grid layout: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 divide-x-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className={`flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group ${index !== 0 ? 'md:pl-6' : ''}`}
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#FF6A00] group-hover:scale-110 group-hover:bg-[#FF6A00] group-hover:text-white transition-all duration-300">
                {badge.icon}
              </div>
              
              {/* Text Content */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-0.5">
                  {badge.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug max-w-[180px] mx-auto sm:mx-0">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
