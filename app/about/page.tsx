export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-6 text-slate-900">About Kabale Online</h1>
      
      <div className="prose prose-slate lg:prose-lg">
        <p className="text-xl text-slate-600 leading-relaxed mb-8">
          We are the digital notice board for the Kigezi region. Our mission is to bridge the gap between 
          <strong> Kabale University students</strong>, local <strong>farmers</strong>, and small business owners.
        </p>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">Why We Built This</h2>
        <p className="mb-6">
          Kabale is a vibrant town, but finding a cheap hostel, selling a used laptop, or knowing the current 
          price of Irish potatoes shouldn't require walking through the whole town. We built this platform to 
          make local commerce faster, safer, and more transparent.
        </p>

        <div className="bg-amber-50 border border-amber-100 p-8 rounded-2xl mb-8">
          <h3 className="font-bold text-amber-900 mb-2 italic">"For the Community, By the Community"</h3>
          <p className="text-amber-800 text-sm m-0">
            Whether you are a student disposing of items after graduation or a farmer in Muchahi looking 
            for buyers, Okay Notice is your home.
          </p>
        </div>

        <h2 className="font-bold text-2xl mb-4 text-slate-900">Our Values</h2>
        <ul className="list-disc pl-6 space-y-2 mb-8">
          <li><strong>Trust:</strong> We promote face-to-face transactions and Cash on Delivery.</li>
          <li><strong>Local First:</strong> We prioritize vendors and services within the Kabale district.</li>
          <li><strong>Empowerment:</strong> We help students turn their side-hustles into real businesses.</li>
        </ul>
      </div>
    </div>
  );
}