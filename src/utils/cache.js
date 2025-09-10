import NodeCache from "node-cache";

const ttl = parseInt(process.env.CACHE_TTL_SECONDS || "300", 10);
export const cache = new NodeCache({ stdTTL: ttl, checkperiod: Math.max(60, ttl / 2) });