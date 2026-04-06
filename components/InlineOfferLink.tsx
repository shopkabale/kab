"use client";

export default function InlineOfferLink({ product, safeName }: { product: any, safeName: string }) {
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  const handleOfferClick = () => {
    // 🔥 Track the inline link click!
    fetch("/api/products/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(console.error);
  };

  return (
    <a 
      href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(`Hi! I want to make an offer for this item on Kabale Online:\n\n*${safeName}*\nProduct ID: [${product.id}]\n\nMy offer is: UGX `)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleOfferClick}
      className="text-[#D97706] font-bold underline decoration-slate-300 underline-offset-4 hover:decoration-[#D97706] transition-colors"
    >
      Tap me to tell us your price.
    </a>
  );
}
