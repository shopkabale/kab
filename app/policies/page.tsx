import Link from "next/link";
import { FaShieldAlt, FaMoneyBillWave, FaBoxOpen, FaHandshake } from "react-icons/fa";

export const metadata = {
  title: "Policies & Terms | Kabale Online",
  description: "Buyer protection, refund policies, and seller terms for Kabale Online.",
};

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-10 text-center">
          <h1 className="text-3xl font-black text-white mb-3">Policies & Terms of Service</h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Everything you need to know about buying safely, selling profitably, and how Kabale Online protects our community.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10 space-y-10 text-slate-700 leading-relaxed">

          {/* SECTION 1: BUYER PROTECTION */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
              <FaShieldAlt className="text-[#D97706]" /> 1. Buyer Protection & Refunds
            </h2>
            <p className="mb-4">
              We want you to shop with absolute confidence. Kabale Online acts as a secure bridge between you and local sellers.
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3 items-start">
                <span className="text-red-500 font-bold mt-0.5">⏱️</span>
                <div>
                  <strong className="text-slate-900 block">The 24-Hour Fulfillment Guarantee</strong>
                  If you pay for an item online via Mobile Money and the seller does not accept and fulfill the order within 24 hours, the order is automatically cancelled, and a <strong className="text-slate-900">100% full refund</strong> is immediately initiated to your Mobile Money account.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-red-500 font-bold mt-0.5">🔍</span>
                <div>
                  <strong className="text-slate-900 block">Inspect Before You Accept</strong>
                  For Cash on Delivery (COD) orders, you have the right to inspect the item upon delivery. If it does not match the description, is defective, or is counterfeit, you may reject it on the spot at no cost.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-red-500 font-bold mt-0.5">💳</span>
                <div>
                  <strong className="text-slate-900 block">Refund Processing Times</strong>
                  Approved Mobile Money refunds typically reflect in your account within 3 to 5 business days, depending on the network provider (MTN/Airtel).
                </div>
              </li>
            </ul>
          </section>

          {/* SECTION 2: SELLER TERMS & COMMISSIONS */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
              <FaHandshake className="text-[#D97706]" /> 2. Seller Terms & Commissions
            </h2>
            <p className="mb-4">
              Kabale Online provides the marketing, AI search engine, and secure payment infrastructure to help you grow your local business.
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-slate-900 block">Free to List</strong>
                  Posting your items on Kabale Online is 100% free. You only pay when you make a successful sale.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-slate-900 block">Platform Commission (Online Payments)</strong>
                  To cover payment gateway fees, server hosting, and platform maintenance, a small <strong className="text-[#D97706]">5% commission fee</strong> is deducted from all successfully completed Mobile Money transactions. The remaining 95% is paid out directly to your registered seller wallet/number.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-slate-900 block">Cash on Delivery (COD) Rules</strong>
                  For COD orders, sellers collect 100% of the cash directly from the buyer. Kabale Online reserves the right to review high-volume COD sellers and may introduce subscription tiers in the future.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-slate-900 block">Seller Payouts</strong>
                  Once an online-paid order is marked as "Delivered" and the buyer confirms receipt without disputes, seller payouts are processed within 24 to 48 hours.
                </div>
              </li>
            </ul>
          </section>

          {/* SECTION 3: PROHIBITED ITEMS */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
              <FaBoxOpen className="text-[#D97706]" /> 3. Prohibited Items
            </h2>
            <p className="mb-3">To keep our community safe, the following items are strictly forbidden on Kabale Online:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Illegal drugs, narcotics, or prescription medication.</li>
              <li>Weapons, firearms, and explosive materials.</li>
              <li>Counterfeit goods, fake currency, or stolen property.</li>
              <li>Adult content, pornography, or sexually explicit material.</li>
              <li>Live animals (unless explicitly approved in the Agriculture category).</li>
            </ul>
            <p className="text-sm text-red-600 mt-3 font-medium">
              Listings violating these rules will be deleted immediately, and the seller's account will be permanently banned.
            </p>
          </section>

          {/* SECTION 4: PRIVACY */}
          <section>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
              <FaMoneyBillWave className="text-[#D97706]" /> 4. Data Privacy
            </h2>
            <p className="mb-4">
              Your privacy is our priority. Your phone numbers, locations, and chat histories are used strictly for facilitating orders. We will never sell your personal data to third-party advertising companies. Financial details are securely processed via LivePay and Flutterwave; Kabale Online does not store your Mobile Money PINs or credit card numbers.
            </p>
          </section>

        </div>

        {/* Footer CTA */}
        <div className="bg-slate-50 border-t border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Have a question about an order or our policies?</p>
          <Link href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER}?text=Hi! I have a question about Kabale Online policies.`} target="_blank" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}
