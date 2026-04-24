import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import InviteRedirect from './InviteRedirect';

type Props = {
  params: { code: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const code = params.code;
  
  let title = "You've been invited to Kabale Online! 🎁";
  let description = "Join Kabale Online to buy and sell locally with Cash on Delivery.";
  
  // Default image URL
  let ogImageUrl = "https://www.kabaleonline.com/api/og";

  if (code) {
    try {
      const snapshot = await adminDb.collection("users")
        .where("referralCode", "==", code)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const referrerName = snapshot.docs[0].data().displayName || "A friend";
        const firstName = referrerName.split(' ')[0]; 
        
        title = `${firstName} invited you to Kabale Online! 🎁`;
        description = `Click here to accept ${firstName}'s invite and shop safely on campus with Cash on Delivery.`;
        
        // 🚀 Add the name to the image URL so it prints on the graphic!
        ogImageUrl = `https://www.kabaleonline.com/api/og?name=${encodeURIComponent(firstName)}`;
      }
    } catch (error) {
      console.error("Failed to fetch referrer for OG tags", error);
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
          url: ogImageUrl, // 🚀 Dynamic Image applied here
          width: 1200,
          height: 630,
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
  return <InviteRedirect code={params.code} />;
}
