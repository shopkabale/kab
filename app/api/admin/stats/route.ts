import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Count standard documents rapidly
    const usersCount = await adminDb.collection("users").count().get();
    const productsCount = await adminDb.collection("products").count().get();
    const ordersCount = await adminDb.collection("orders").count().get();
    const searchesCount = await adminDb.collection("search_queries").count().get();

    // 🔥 NEW: Count WhatsApp Chats & Messages efficiently
    const botChatsCount = await adminDb.collection("chats").count().get();
    
    // Using collectionGroup efficiently counts every message in every subcollection 
    // across the entire database without charging you for massive document reads!
    const totalMessagesCount = await adminDb.collectionGroup("messages").count().get();

    // Calculate total revenue from all orders
    const ordersSnapshot = await adminDb.collection("orders").get();
    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
      totalRevenue += (Number(doc.data().total) || 0);
    });

    return NextResponse.json({
      totalUsers: usersCount.data().count,
      totalProducts: productsCount.data().count,
      totalOrders: ordersCount.data().count,
      totalRevenue,
      totalSearches: searchesCount.data().count,
      totalBotChats: botChatsCount.data().count,      // 👈 ADDED: Unique people who chatted
      totalMessages: totalMessagesCount.data().count, // 👈 ADDED: Total chat volume
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
