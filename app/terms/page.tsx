export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-slate lg:prose-lg">
      <h1 className="text-4xl font-black mb-4 text-slate-900">
        Terms & Conditions
      </h1>
      <p className="text-sm text-slate-500 mb-8 italic">
        Last Updated: March 2026
      </p>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Kabale Online, you agree to comply with and be 
          bound by these Terms & Conditions. If you do not agree with any part 
          of these terms, you should not use the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">2. Our Role & Platform Facilitation</h2>
        <p>
          Kabale Online is a digital marketplace that connects buyers and sellers 
          within Kabale town and the greater Kigezi region. While we primarily facilitate 
          these connections, we may coordinate logistics and deliveries to improve 
          the user experience. However, the core transaction remains between the 
          buyer and the seller.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">3. User Responsibilities</h2>
        <p>
          Users are responsible for ensuring that all information provided in 
          listings is accurate and truthful. Misleading descriptions, false 
          advertising, or impersonation are strictly prohibited. Buyers are 
          responsible for inspecting goods before making payment.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">4. Safety & Payments</h2>
        <p>
          Kabale Online strongly recommends Cash on Delivery (COD). Users should 
          meet in safe, public locations and verify items before payment. We are 
          not liable for fraudulent transactions, payment disputes, damages, or 
          losses resulting from user interactions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">5. Prohibited & Restricted Items</h2>
        <p>
          Users may not list illegal substances, stolen property, counterfeit 
          goods, weapons, hazardous materials, or any items prohibited under 
          Ugandan law. Kabale Online reserves the right to remove any listing 
          that violates these rules without prior notice.
        </p>
      </section>

      {/* NEW UPGRADED SECTIONS START HERE */}

      <hr className="my-10 border-slate-300" />

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">6. Buyer Terms & Responsibilities</h2>
        <p><strong>Order Accuracy:</strong> Buyers must provide a correct name, active phone number, and accurate delivery location. Failure to do so may result in order cancellation or account restriction.</p>
        <p><strong>Order Commitment:</strong> By placing an order, the buyer agrees to be available at the delivery time and accept the delivery if the item matches the description.</p>
        <p><strong>Refusals:</strong> Buyers may only refuse orders if the item is incorrect, damaged, or does not match the listing. Unjustified refusals or repeated cancellations may lead to warnings, limited ordering ability, or permanent account bans.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">7. Seller Terms & Obligations</h2>
        <p><strong>Listing Accuracy & Stock:</strong> Sellers must ensure accurate descriptions, real images, and correct pricing. Sellers must only list available items and update stock regularly. Listing unavailable items is a direct violation.</p>
        <p><strong>Order Fulfillment:</strong> Sellers must confirm orders within the specified time and prepare items immediately. Sellers may not cancel confirmed orders without a valid reason.</p>
        <p><strong>Performance Monitoring:</strong> Kabale Online tracks delivery success rates, response times, and cancellation rates. Low-performing sellers may be deprioritized in search results or removed from the platform entirely.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">8. Enforcement, Penalties & Consequences</h2>
        <p>Kabale Online enforces strict compliance to maintain trust. We utilize a warning system where first violations receive a warning, and repeated violations result in stricter actions.</p>
        <p>Penalties for violating platform rules may include reduced listing visibility, temporary suspension, permanent account removal, and potential financial penalties for failed fulfillment.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">9. Affiliate & Ambassador Program</h2>
        <p><strong>Eligibility & Commission:</strong> Users may participate as affiliates upon approval. Commissions are earned <em>only</em> on successfully delivered orders. No commissions are paid out for canceled or undelivered orders.</p>
        <p><strong>Fraud Prevention:</strong> Self-referrals, fake orders, and manipulated transactions are strictly prohibited and will result in immediate loss of earnings and account suspension.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">10. Referral & Cookie Tracking</h2>
        <p>Kabale Online uses cookies and internal systems to attribute referrals. Referrals are valid within a limited time window. Users acknowledge that tracking systems may not be perfect, and Kabale Online's system records dictate final attribution.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">11. Delivery & Fulfillment Disclaimer</h2>
        <p>While Kabale Online may facilitate delivery and coordinate logistics, we do not strictly guarantee delivery times or total seller compliance. We are not legally liable for delays caused by sellers or failed deliveries due to user error.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">12. Platform Control Rights & Dispute Resolution</h2>
        <p>Kabale Online reserves the right to remove listings, restrict users, adjust visibility, and modify platform rules at its sole discretion to maintain platform integrity.</p>
        <p>Users are encouraged to resolve disputes amicably between themselves. While Kabale Online may intervene to mediate, we are not obligated to do so, and platform decisions are final where applicable.</p>
      </section>

      <hr className="my-10 border-slate-300" />

      <section className="mb-8">
        <h2 className="font-bold text-xl mb-2">13. Changes to Terms</h2>
        <p>
          We may update these Terms & Conditions at any time. Continued use 
          of the platform after updates constitutes acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-xl mb-2">14. Contact</h2>
        <p>
          If you have questions regarding these Terms & Conditions, please 
          contact us through the official Kabale Online communication channels.
        </p>
      </section>
    </div>
  );
}
