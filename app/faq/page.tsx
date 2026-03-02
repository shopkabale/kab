export default function FAQPage() {
  const faqs = [
    {
      q: "What is Kabale Online?",
      a: "Kabale Online is a local digital marketplace connecting students, farmers, and small businesses within Kabale town and the greater Kigezi region. It allows users to buy, sell, and promote goods and services within their community."
    },
    {
      q: "Is delivery free?",
      a: "Delivery arrangements are negotiated directly between the buyer and seller. Many students meet at Kabale University campus gates or central town locations for convenience and safety."
    },
    {
      q: "How do I pay?",
      a: "We strongly recommend Cash on Delivery (COD). Always meet in person, inspect the item carefully, and confirm its condition before making payment. Avoid sending Mobile Money in advance to unknown sellers."
    },
    {
      q: "How do I post an item for sale?",
      a: "Create an account, click on 'Post Listing', upload clear photos, write a detailed description, set your price, and publish. The more clear and honest your listing is, the faster it will sell."
    },
    {
      q: "Can I sell farm produce?",
      a: "Yes. Kabale Online proudly supports local farmers. You can list Irish potatoes, onions, beans, vegetables, and other produce in the Agriculture category to reach bulk buyers and retailers."
    },
    {
      q: "Can I advertise my hostel or rental rooms?",
      a: "Yes. Landlords and hostel managers can list available rooms, include pricing, location details, and contact information to attract Kabale University students and other tenants."
    },
    {
      q: "Is Kabale Online involved in transactions?",
      a: "No. Kabale Online only connects buyers and sellers. We do not handle payments, deliveries, or hold goods. All agreements are made directly between users."
    },
    {
      q: "How do I stay safe while buying or selling?",
      a: "Always meet in public places, avoid advance payments, verify items before paying, and communicate clearly. If something feels suspicious, do not proceed with the transaction."
    },
    {
      q: "Are there fees for posting?",
      a: "Basic listings are free. In the future, premium promotional options may be introduced for businesses that want more visibility."
    },
    {
      q: "Who can use Kabale Online?",
      a: "Anyone in Kabale district and the Kigezi region — students, farmers, entrepreneurs, shop owners, and residents — can use the platform to connect and trade locally."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-4 text-slate-900">
        Frequently Asked Questions
      </h1>

      <p className="text-slate-600 mb-10 text-lg">
        Everything you need to know about using Kabale Online safely and effectively.
      </p>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-bold text-lg mb-2 text-slate-900">
              {f.q}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {f.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-slate-50 border border-slate-200 p-8 rounded-2xl">
        <h3 className="font-bold text-slate-900 mb-2">
          Still Have Questions?
        </h3>
        <p className="text-slate-600 mb-4">
          If your question isn’t listed here, feel free to contact us directly.
          We're here to support the Kabale community.
        </p>
        <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition">
          Contact Support
        </button>
      </div>
    </div>
  );
}