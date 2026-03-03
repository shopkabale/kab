import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buyer Request Board | Kabale Online",
  description: "See what students and locals in Kabale are looking to buy right now. Have an item? Browse the requests and make a quick, easy sale today.",
  openGraph: {
    title: "Buyer Request Board | Kabale Online",
    description: "See what students and locals in Kabale are looking to buy right now. Have an item? Browse the requests and make a quick, easy sale today.",
    url: "https://www.kabaleonline.com/requests",
    siteName: "Kabale Online",
    images: [
      {
        url: "/og-image.jpg", // Make sure you have an og-image.jpg in your public folder!
        width: 1200,
        height: 630,
        alt: "Okay Notice Buyer Requests",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buyer Request Board | Okay Notice",
    description: "Can't find what you need? Post it here and let Kabale sellers come to you.",
  },
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}