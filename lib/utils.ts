export const optimizeImage = (url: string) => {
  // 1. If there's no URL, or it's not a Cloudinary image, just return it safely
  if (!url || !url.includes("cloudinary.com")) return url;

  // 2. If we already optimized it during upload (your new products), skip it
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  // 3. MAGIC: Inject the WebP & compression parameters into the old URLs!
  // It replaces the standard "/upload/" folder path with the optimized one.
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};
