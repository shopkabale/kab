// ==========================================
// IMAGE OPTIMIZATION (Existing)
// ==========================================
export const optimizeImage = (url: string): string => {
  // 1. If there's no URL, or it's not a Cloudinary image, just return it safely
  if (!url || !url.includes("cloudinary.com")) return url;

  // 2. If we already optimized it during upload (your new products), skip it
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  // 3. MAGIC: Inject the WebP & compression parameters into the old URLs!
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

// ==========================================
// KABALE ONLINE DEPOSIT LOGIC (New)
// ==========================================
export const calculateDepositAmount = (price: number, isAdminRestricted: boolean = false): number => {
  // If it's under 20k AND the admin hasn't forced a deposit, charge 0 (Pure COD)
  if (price < 50001 && !isAdminRestricted) {
    return 0;
  }

  // Calculate 25% of the item price
  const percentageDeposit = price * 0.25;

  // Return whichever is higher: 10,000 UGX or 25%
  return Math.max(10000, percentageDeposit);
};
