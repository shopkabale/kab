export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        
        <h1 className="text-4xl font-bold mb-4">
          Returns & Refund Policy
        </h1>

        <p className="text-gray-600 mb-10">
          At Kabale Online, customer satisfaction is important to us. 
          If you receive a damaged, defective, or wrong item, we are here to help.
        </p>

        <div className="space-y-8">

          {/* Eligible Returns */}
          <section className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              Eligible Returns
            </h2>

            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Wrong item delivered</li>
              <li>Damaged product</li>
              <li>Defective item</li>
              <li>Item significantly different from description</li>
            </ul>
          </section>

          {/* Return Period */}
          <section className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              Return Period
            </h2>

            <p className="text-gray-700">
              Returns must be requested within <strong>3 days</strong> after delivery.
            </p>
          </section>

          {/* Non Returnable */}
          <section className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              Non-Returnable Items
            </h2>

            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Used products</li>
              <li>Opened cosmetics or beauty items</li>
              <li>Items damaged after delivery by the customer</li>
              <li>Products without original packaging</li>
            </ul>
          </section>

          {/* Refund Options */}
          <section className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              Refund Options
            </h2>

            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Product replacement</li>
              <li>Store credit</li>
              <li>Mobile Money refund</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              Need Help?
            </h2>

            <p className="text-gray-700 mb-2">
              Contact our support team for return assistance.
            </p>

            <div className="space-y-1 text-gray-700">
              <p>WhatsApp: +256759997376</p>
              <p>Email: support@kabaleonline.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}