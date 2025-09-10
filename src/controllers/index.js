import express from "express";
import placesRouter from "./placesController.js";

const router = express.Router();

// all routes
router.use("/places", placesRouter);

export default router;