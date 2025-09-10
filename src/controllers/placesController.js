import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { LLMService } from "../services/llmService.js";
import { GoogleMapsService } from "../services/googleMapsService.js";

const router = express.Router();

const llm = new LLMService(process.env.HF_TOKEN);

const maps = new GoogleMapsService(process.env.GOOGLE_MAPS_API_KEY);

router.post("/", async (req, res) => {
    try {
        const { prompt, location } = req.body;
        
        if (!prompt) return res.status(400).json({ error: "prompt is required" });

        // 1) parse with LLM to extract normalized query/filters
        const parsed = await llm.parseIntent(prompt);
        const textQuery = (parsed.query && parsed.query.length > 0) ? parsed.query : prompt;

        // 2) call Google Places Text Search
        const placesResp = await maps.textSearch({
            query: textQuery,
            location,
            radius: parsed.radius_meters,
            type: parsed.type,
            openNow: parsed.open_now
        });

        const places = (placesResp.results || []).slice(0, 10).map(p => ({
            name: p.name,
            place_id: p.place_id,
            address: p.formatted_address || p.vicinity,
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            location: p.geometry?.location
        }));

        // For each place include embed url and directions link
        const results = places.map(p => ({
            ...p,
            embed_url: maps.embedPlaceUrl({ placeId: p.place_id, q: p.name }),
            directions_url: maps.directionsLinkToPlace({ placeId: p.place_id, lat: p.location?.lat, lng: p.location?.lng })
        }));

        return res.json({
            query: textQuery,
            parsed,
            count: results.length,
            results
        });
    } catch (err) {
        console.error("places error:", err?.message || err);
        return res.status(500).json({ error: "Internal error", details: err?.message });
    }
});

export default router;