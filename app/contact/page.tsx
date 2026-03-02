export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-4">Contact Support</h1>
      <p className="text-slate-600 mb-8 text-lg">We're here to help the Kabale community. Reach out through any channel below.</p>
      
      <div className="space-y-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="font-bold text-xl mb-4">Get in Touch</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <a href="mailto:support@kabaleonline.com" className="text-primary font-bold">support@kabaleonline.com</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                <a href="https://wa.me/256759997376" className="text-emerald-600 font-bold">0759997376</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl">📞</span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Direct Calls</p>
                <a href="tel:+256784655792" className="text-slate-900 font-bold">0784655792</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}