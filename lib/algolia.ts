import algoliasearch from "algoliasearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const adminKey = process.env.ALGOLIA_ADMIN_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME;

if (!appId || !adminKey || !indexName) {
  console.warn("Algolia environment variables are missing.");
}

// We use the Admin Key here because this is strictly for server-side indexing
export const algoliaAdminClient = algoliasearch(appId || "", adminKey || "");
export const algoliaIndex = algoliaAdminClient.initIndex(indexName || "kabale_products");