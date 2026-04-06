import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// 🔥 Protect this route so only Vercel can trigger it
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  // Security check: Make sure this is triggered by our Cron Job
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const productsRef = adminDb.collection("products");
    
    // Fetch all active products
    const snapshot = await productsRef.where("status", "in", ["active", "approved"]).get();
    
    const batch = adminDb.batch(); // Process updates in a single, cheap database batch
    let deadCount = 0;
    let boostCount = 0;
    let featuredCount = 0;

    // Array to temporarily hold items so we can rank them
    const activeScoringPool: any[] = [];

    // ==========================================
    // PHASE 1: SCORING & ARCHIVING
    // ==========================================
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const views = data.views || 0;
      const sales = data.sales || 0;
      const inquiries = data.inquiries || 0; // 🔥 Now using our new inquiry tracking!
      const isOfficial = data.isAdminUpload ? 1 : 0;
      
      // Calculate age in days
      const createdAt = data.createdAt?._seconds ? data.createdAt._seconds * 1000 : (data.createdAt || now);
      const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

      // 1. AUTO-HIDE DEAD PRODUCTS
      // If older than 60 days, < 15 views, 0 sales, and 0 inquiries -> Archive it.
      if (daysOld > 60 && views < 15 && sales === 0 && inquiries === 0) {
        batch.update(doc.ref, { status: "archived" });
        deadCount++;
        return; // Skip scoring for dead items
      }

      // 2. AI RANKING CALCULATION
      // Views (1x) + Inquiries (20x) + Sales (50x) + Admin (100x) - Age Decay
      let aiScore = views + (inquiries * 20) + (sales * 50) + (isOfficial * 100) - (daysOld * 2);
      if (aiScore < 0) aiScore = 0;

      // 3. ADMIN HIGH-CONVERSION DETECTION
      let isFeatured = data.isFeatured || false;
      if (data.isAdminUpload && views > 50) {
        // We count sales, but also give partial credit for inquiries (intent to buy)
        const conversionRate = (sales + (inquiries * 0.5)) / views;
        if (conversionRate > 0.02) { // Greater than 2% conversion rate
          isFeatured = true;
          featuredCount++;
        }
      }

      // Queue the basic updates to Firestore
      batch.update(doc.ref, { aiScore, isFeatured });

      // Add to our temporary pool to figure out who gets boosted
      activeScoringPool.push({ id: doc.id, ref: doc.ref, aiScore, daysOld });
    });

    // ==========================================
    // PHASE 2: AUTO-BOOST TOP TRENDING
    // ==========================================
    // Sort pool by highest AI score
    activeScoringPool.sort((a, b) => b.aiScore - a.aiScore);
    
    // Take the top 10 items that are newer than 14 days to keep feeds fresh
    const trendingWinners = activeScoringPool
      .filter(item => item.daysOld <= 14)
      .slice(0, 10);

    const tomorrow = now + (24 * 60 * 60 * 1000); // Boost lasts 24 hours

    trendingWinners.forEach(winner => {
      batch.update(winner.ref, { 
        isBoosted: true, 
        boostExpiresAt: tomorrow 
      });
      boostCount++;
    });

    // Commit all database updates at once
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: "Marketplace engine executed successfully.",
      stats: { archived: deadCount, newlyBoosted: boostCount, newlyFeatured: featuredCount }
    });

  } catch (error) {
    console.error("Engine failure:", error);
    return NextResponse.json({ error: "Failed to run engine" }, { status: 500 });
  }
}
