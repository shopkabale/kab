import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn | Kabale Online Partner Program",
  description:
    "Invite friends to Kabale Online and earn 3,000 UGX directly to your Mobile Money for every new customer. Join the campus partner program today!",
  openGraph: {
    title: "Earn 3,000 UGX per Referral | Kabale Online",
    description:
      "Get paid directly to your MTN/Airtel Mobile Money when you invite friends to shop official items on Kabale Online. Start earning today!",
    url: "https://www.kabaleonline.com/refer",
    siteName: "Kabale Online",
    images: [
      {
        url: "/og-image.jpg", // Uses your existing root OG image
        width: 1200,
        height: 630,
        alt: "Kabale Online Partner Program - Earn Cash",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn 3,000 UGX per Referral | Kabale Online",
    description: "Get paid to your Mobile Money when you invite friends to shop on Kabale Online.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://www.kabaleonline.com/refer",
  },
};

export default function ReferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
