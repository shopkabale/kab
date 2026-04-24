import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn | Kabale Online Partner Program",
  description:
    "Invite friends to Kabale Online and earn 3,000 UGX directly to your Mobile Money for every new customer. Join the campus partner program today!",
  openGraph: {
    title: "Earn 3,000 UGX per Referral | Kabale Online",
    description:
      "Get paid directly to your MTN/Airtel Mobile Money when you invite friends to shop official items on Kabale Online. Start earning today!",
    url: "https://www.kabaleonline.com/invite",
    siteName: "Kabale Online",
    images: [
      {
        // 🚀 Points to the dynamic image generator
        url: "https://www.kabaleonline.com/api/og", 
        width: 1200,
        height: 630,
        alt: "Kabale Online Partner Program",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn 3,000 UGX per Referral | Kabale Online",
    description: "Get paid to your Mobile Money when you invite friends to shop on Kabale Online.",
    images: ["https://www.kabaleonline.com/api/og"],
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
