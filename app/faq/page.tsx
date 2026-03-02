export default function FAQPage() {
  const faqs = [
    { q: "Is delivery free?", a: "Delivery is negotiated between the buyer and seller. Most students meet at the campus gate or central town locations." },
    { q: "How do I pay?", a: "We strictly support Cash on Delivery (COD). Never send money via Mobile Money before seeing and verifying the item." },
    { q: "Can I sell farm produce?", a: "Yes! Kabale Online supports local farmers. You can list Irish potatoes, onions, and other produce in the Agriculture section." }
  ];

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-8">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl">
            <h3 className="font-bold text-lg mb-2 text-slate-900">{f.q}</h3>
            <p className="text-slate-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}