export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-6 text-slate-900">
        About Kabale Online
      </h1>

      <div className="prose prose-slate lg:prose-lg">
        <p className="text-xl text-slate-600 leading-relaxed mb-8">
          Kabale Online is the digital marketplace and community notice board 
          for Kabale town and the greater Kigezi region. We connect 
          <strong> Kabale University students</strong>, local <strong>farmers</strong>, 
          small <strong>business owners</strong>, and everyday residents in one 
          trusted online space.
        </p>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">
          Our Mission
        </h2>
        <p className="mb-6">
          Our mission is simple: make buying, selling, and discovering opportunities 
          in Kabale easier, safer, and faster. Whether you're searching for a hostel 
          near campus, selling a second-hand laptop, promoting your retail shop, or 
          checking current market prices for Irish potatoes, Kabale Online helps 
          you do it without unnecessary movement or middlemen.
        </p>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">
          Why We Built Kabale Online
        </h2>
        <p className="mb-6">
          Kabale is a vibrant and growing town full of hardworking students, 
          entrepreneurs, and farmers. However, information often moves slowly 
          and opportunities can be hard to find. We created Kabale Online to 
          bridge that gap — bringing the entire community into one digital space 
          where opportunities are visible and accessible to everyone.
        </p>

        <div className="bg-amber-50 border border-amber-100 p-8 rounded-2xl mb-8">
          <h3 className="font-bold text-amber-900 mb-2 italic">
            "Built for Kabale. Powered by Community."
          </h3>
          <p className="text-amber-800 text-sm m-0">
            From a student selling furniture after graduation to a farmer in 
            Rubanda looking for bulk buyers — Kabale Online exists to make 
            local trade simple and community-driven.
          </p>
        </div>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">
          What You Can Do on Kabale Online
        </h2>
        <ul className="list-disc pl-6 space-y-2 mb-8">
          <li>Post items for sale (electronics, furniture, clothing, etc.)</li>
          <li>Advertise hostels and rental properties</li>
          <li>Promote local businesses and services</li>
          <li>Connect directly with buyers and sellers</li>
          <li>Discover verified opportunities within Kabale district</li>
        </ul>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">
          Our Values
        </h2>
        <ul className="list-disc pl-6 space-y-2 mb-8">
          <li>
            <strong>Trust:</strong> We encourage safe, face-to-face transactions 
            and transparent communication.
          </li>
          <li>
            <strong>Local First:</strong> We prioritize vendors, services, and 
            opportunities within Kabale and the Kigezi region.
          </li>
          <li>
            <strong>Empowerment:</strong> We support students and young 
            entrepreneurs in turning side hustles into sustainable income.
          </li>
          <li>
            <strong>Simplicity:</strong> A clean, easy-to-use platform designed 
            for everyone.
          </li>
        </ul>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">
          Our Vision
        </h2>
        <p>
          We envision a digitally connected Kabale where information flows 
          freely, businesses grow faster, and the community thrives together. 
          Kabale Online is more than a website — it’s a platform built to 
          strengthen local commerce and create real economic impact in the region.
        </p>
      </div>
    </div>
  );
}