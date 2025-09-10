import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

import { createRateLimiter } from "./middleware/rateLimiter.js";
import router from "./controllers/index.js";

const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(bodyParser.json());

// global rate limiter
app.use(createRateLimiter({
    windowMs: parseInt(process.env.RATELIMIT_WINDOW_MS || "60000"),
    max: parseInt(process.env.RATELIMIT_MAX || "60")
}));

app.use("/api", router);

app.get("/api", (req, res) => res.send("Maps LLM Backend"));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));