export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-slate">
      <h1 className="text-4xl font-black mb-4">Terms & Conditions</h1>
      <p className="text-sm text-slate-500 mb-8 italic">Last Updated: March 2026</p>
      
      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">1. Our Role</h2>
        <p>Kabale Online is a marketplace platform connecting buyers and sellers in Kabale. We do not own, inspect, or store any items listed on the site.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">2. Safety & Payments</h2>
        <p>We strictly advise using **Cash on Delivery**. Users are responsible for verifying the quality and authenticity of items before payment. Kabale Online is not liable for fraudulent transactions or quality disputes.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">3. Restricted Items</h2>
        <p>Users are prohibited from listing illegal substances, stolen property, or harmful items. We reserve the right to delete any listing without notice.</p>
      </section>
    </div>
  );
}