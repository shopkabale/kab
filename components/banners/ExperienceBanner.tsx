import { ShieldCheck, Truck, Headphones } from "lucide-react";

export default function ExperienceBanner() {
  const features = [
    {
      icon: <ShieldCheck className="text-[#FF6A00]" size={28} />,
      title: "Genuine Electronics",
      desc: "100% verified authentic products with warranty."
    },
    {
      icon: <Truck className="text-[#FF6A00]" size={28} />,
      title: "Fast Delivery",
      desc: "Swift and secure dispatch directly to your door."
    },
    {
      icon: <Headphones className="text-[#FF6A00]" size={28} />,
      title: "Customer Support",
      desc: "We are here to help you before and after you buy."
    }
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/60">
      <div className="text-center mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          We deliver customer experiences
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Shopping for electronics should be seamless and secure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {features.map((feature, idx) => (
          <div key={idx} className="flex flex-col items-center text-center pt-6 md:pt-0 px-4 first:pt-0">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center mb-4 shadow-inner">
              {feature.icon}
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
