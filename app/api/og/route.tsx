import { ImageResponse } from 'next/og';

// This forces the route to run on Vercel's fast Edge network
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Grab the dynamic text passed in the URL, with safe fallbacks
    const title = searchParams.get('title') || 'Kabale Online Marketplace';
    const description = searchParams.get('desc') || 'The Better Way to Inform Your Community';

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
          }}
        >
          {/* Logo / Brand Name */}
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 'black', marginBottom: '20px', letterSpacing: '-0.05em' }}>
            <span style={{ color: 'white' }}>Kabale</span>
            <span style={{ color: '#D97706' }}>Online</span>
          </div>

          {/* Dynamic Category Title */}
          <div style={{ 
            display: 'flex', 
            fontSize: 84, 
            fontWeight: 'black', 
            color: 'white', 
            textAlign: 'center', 
            lineHeight: 1.1,
            marginBottom: '30px',
            padding: '0 40px'
          }}>
            {title}
          </div>

          {/* Dynamic Description or Tagline */}
          <div style={{ display: 'flex', fontSize: 36, color: '#94a3b8', textAlign: 'center', fontWeight: 'bold' }}>
            {description}
          </div>
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
