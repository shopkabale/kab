import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import InviteRedirect from './InviteRedirect';

// 🚀 CRITICAL FIX: Forces Next.js to fetch fresh data on every share, completely bypassing static caching
export const dynamic = 'force-dynamic';

type Props = {
  params: { code: string }
}

// 🚀 DYNAMIC SEO: Generates the WhatsApp/Social card
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const code = params.code;

  // Default fallback text if code is invalid or database fails
  let title = "You've been invited to Kabale Online! 🎁";
  let description = "Join Kabale Online to buy and sell locally with Cash on Delivery.";
  let ogImageUrl = "https://www.kabaleonline.com/api/og";

  // 🔥 FIX: Removed the strict length check so it actually runs the database query
  if (code) {
    try {
      const snapshot = await adminDb.collection("users")
        .where("referralCode", "==", code)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();

        // 🚀 SMART NAME LOGIC: Use custom alias first, fallback to Google first name
        let displayAlias = userData.referralName;

        if (!displayAlias) {
          const fullName = userData.displayName || "A friend";
          displayAlias = fullName.split(' ')[0]; // Grab just the first name
        }

        // Override with the personalized text!
        title = `${displayAlias} invited you to Kabale Online! 🎁`;
        description = `Click here to accept ${displayAlias}'s invite and shop safely on campus with Cash on Delivery.`;

        // 🚀 Add the customized name to the image URL so it prints on the graphic
        ogImageUrl = `https://www.kabaleonline.com/api/og?name=${encodeURIComponent(displayAlias)}`;
      }
    } catch (error) {
      console.error("Failed to fetch referrer for OG tags:", error);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.kabaleonline.com/invite/${code}`,
      siteName: "Kabale Online",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_UG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function InvitePage({ params }: Props) {
  // Pass the referral code to our Client Component to handle tracking & redirect
  return <InviteRedirect code={params.code} />;
}
