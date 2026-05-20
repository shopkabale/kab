import { ImageResponse } from 'next/og';

// This forces the route to run on Vercel's fast Edge network
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 🚀 NEW: Check if this is a referral invite
    const name = searchParams.get('name');
    const isInvite = !!name;

    // 🔥 NEW: Check if this is a Deal
    const price = searchParams.get('price');
    const discount = searchParams.get('discount');
    const dealType = searchParams.get('dealType');
    const isDeal = !!price || !!dealType;

    // Grab the dynamic text passed in the URL, with safe fallbacks and Invite Overrides
    const title = isInvite 
      ? `${name} invited you to Kabale Online! 🎁`
      : (searchParams.get('title') || 'Kabale Online Marketplace');

    // 🔥 FIXED: Strictly e-commerce focused messaging
    const description = isInvite
      ? 'Accept the invite and shop safely on campus with Cash on Delivery.'
      : (searchParams.get('desc') || 'The Better Way to Buy and Sell Locally');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // A sleek dark slate background
            fontFamily: 'sans-serif',
            padding: '40px',
            borderTop: isInvite ? '20px solid #D97706' : '0px', // 🔥 Orange highlight only for invites
          }}
        >
          {/* Logo / Brand Name */}
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 'black', marginBottom: '20px', letterSpacing: '-0.05em' }}>
            <span style={{ color: 'white' }}>Kabale</span>
            <span style={{ color: '#D97706' }}>Online</span>
          </div>

          {/* 🔥 NEW: Deal Badge (Only renders if dealType is provided) */}
          {isDeal && dealType && (
            <div style={{ display: 'flex', background: 'rgba(217, 119, 6, 0.15)', border: '2px solid #D97706', padding: '10px 25px', borderRadius: '12px', fontSize: 26, fontWeight: 'bold', color: '#fdba74', textTransform: 'uppercase', marginBottom: '20px' }}>
              {dealType} {discount && <span style={{ color: '#ef4444', marginLeft: '12px' }}> -{discount}%</span>}
            </div>
          )}

          {/* Dynamic Category Title */}
          <div style={{ 
            display: 'flex', 
            fontSize: isInvite ? 72 : (isDeal ? 64 : 84), // Slightly smaller if it's a long invite name or a deal
            fontWeight: 'black', 
            color: 'white', 
            textAlign: 'center', 
            lineHeight: 1.1,
            marginBottom: isDeal ? '20px' : '30px',
            padding: '0 40px'
          }}>
            {title}
          </div>

          {/* 🔥 NEW: Deal Price (Only renders if price is provided) */}
          {isDeal && price && (
            <div style={{ display: 'flex', fontSize: 80, fontWeight: 'black', color: '#f59e0b', marginBottom: '20px' }}>
              UGX {price}
            </div>
          )}

          {/* Dynamic Description or Tagline */}
          <div style={{ display: 'flex', fontSize: isDeal ? 28 : 36, color: '#94a3b8', textAlign: 'center', fontWeight: 'bold' }}>
            {description}
          </div>

          {/* 🔥 NEW: Extra Trust Badge specifically for Invites */}
          {isInvite && (
            <div style={{ display: 'flex', marginTop: '50px', background: 'rgba(217, 119, 6, 0.2)', border: '2px solid #D97706', color: '#fdba74', padding: '15px 40px', borderRadius: '15px', fontSize: '28px', fontWeight: 'bold' }}>
              Verified Partner Link
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
