import axios from "axios";
import { cache } from "../utils/cache.js";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api";

export class GoogleMapsService {
    constructor(apiKey) {
        if (!apiKey) throw new Error("Google Maps API key required");
        this.apiKey = apiKey;
    }

    // Basic caching wrapper
    async cachedFetch(key, fn, ttlSeconds = undefined) {
        const cached = cache.get(key);
        if (cached) return cached;
        const val = await fn();
        cache.set(key, val, ttlSeconds);
        return val;
    }

    // text search (Places API)
    async textSearch({ query, location, radius = 2000, type = null, openNow = false }) {
        const params = new URLSearchParams();

        params.append("query", query);

        if (location) params.append("location", `${location.lat},${location.lng}`);
        if (radius) params.append("radius", radius.toString());
        if (type) params.append("type", type);

        params.append("key", this.apiKey);

        const url = `${GOOGLE_BASE}/place/textsearch/json?${params.toString()}`;

        const cacheKey = `places:text:${url}`;

        return this.cachedFetch(cacheKey, async () => {
            const r = await axios.get(url, { timeout: 10000 });
            if (r.data.status !== "OK" && r.data.status !== "ZERO_RESULTS") {
                throw new Error(`Places API error: ${r.data.status} ${r.data.error_message || ""}`);
            }
            return r.data;
        });
    }

    // Optionally get place details
    async placeDetails(placeId) {
        const url = `${GOOGLE_BASE}/place/details/json?place_id=${placeId}&key=${this.apiKey}`;

        const cacheKey = `places:details:${placeId}`;
        
        return this.cachedFetch(cacheKey, async () => {
            const r = await axios.get(url, { timeout: 10000 });
            if (r.data.status !== "OK") throw new Error(`Place details error: ${r.data.status}`);
            return r.data.result;
        }, 3600);
    }

    // Build embed URL for a place (Maps Embed API)
    embedPlaceUrl({ placeId, q }) {
        // Use place_id if available to ensure correct result
        if (placeId) {
            return `https://www.google.com/maps/embed/v1/place?key=${this.apiKey}&q=place_id:${placeId}`;
        }
        // fallback to search query
        return `https://www.google.com/maps/embed/v1/search?key=${this.apiKey}&q=${encodeURIComponent(q)}`;
    }

    // Directions link for opening Google Maps (web)
    directionsLinkToPlace({ placeId, lat, lng }) {
        if (placeId) {
            // Google Maps supports directions with place_id in destination param
            return `https://www.google.com/maps/dir/?api=1&destination=place_id:${placeId}`;
        }
        if (lat && lng) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
        }
        return "https://www.google.com/maps";
    }
}