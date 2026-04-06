// lib/analytics.ts

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

// Safe TypeScript declaration for the dataLayer
type WindowWithDataLayer = Window & {
  dataLayer: Record<string, any>[];
};

/**
 * Core function to safely push to GTM dataLayer
 */
export const pushToDataLayer = (event: Record<string, any>) => {
  if (typeof window !== "undefined") {
    const w = window as unknown as WindowWithDataLayer;
    w.dataLayer = w.dataLayer || [];

    // Clear the previous ecommerce object to prevent data leaking across Next.js routes
    if (event.ecommerce) {
      w.dataLayer.push({ ecommerce: null });
    }

    w.dataLayer.push(event);
  }
};

// ==========================================
// E-COMMERCE EVENTS (GA4 / Merchant Center Standard)
// ==========================================

export const trackViewItem = (product: { id: string; name: string; price: number; category: string }) => {
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency: "UGX",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          quantity: 1,
        },
      ],
    },
  });
};

export const trackBeginCheckout = (product: { id: string; name: string; price: number; category: string }) => {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "UGX",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          quantity: 1,
        },
      ],
    },
  });
};

export const trackPurchase = (orderId: string, total: number, items: Array<{ id: string; name: string; price: number }>) => {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: orderId,
      value: total,
      currency: "UGX",
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: 1,
      })),
    },
  });
};

export const trackSelectItem = (product: { id: string; name: string; price: number; category: string }) => {
  pushToDataLayer({
    event: "select_item",
    ecommerce: {
      currency: "UGX",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          quantity: 1,
        },
      ],
    },
  });
};
