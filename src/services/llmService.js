import { pipeline, env } from "@xenova/transformers";

export class LLMService {
    constructor(token) {
        if (token) {
            env.HF_ACCESS_TOKEN = token;
        }

        // lazy load the model
        this.generatorPromise = pipeline(
            "text-generation",
            "Xenova/gpt2"
        );
    }

    async parseIntent(prompt) {
        const systemPrompt = `
            You are an assistant that extracts a short search query and optional filters 
            from a user's natural language request to find places (restaurants, cafes, parks, museums, etc).
            Return ONLY valid JSON with keys:
            { "query": "sushi near jalan thamrin", "type": "restaurant", "radius_meters": 2000, "open_now": false }
            If you cannot extract, set query to empty string.
            `;

        const userPayload = `${systemPrompt}\nUser: ${prompt}`;

        try {
            const generator = await this.generatorPromise;
            const output = await generator(userPayload, {
                max_new_tokens: 200,
                temperature: 0.2,
            });

            const generatedText = output[0]?.generated_text || "";

            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // fallback
            return { query: prompt, type: null, radius_meters: 2000, open_now: false };
        } catch (err) {
            console.error("LLM parse error:", err.message);
            return { query: prompt, type: null, radius_meters: 2000, open_now: false };
        }
    }
}