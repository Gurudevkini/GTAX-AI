import express from "express";
import { getVendors } from "../data/gstData.js";

const router = express.Router();

// GET /vendor/vendors
router.get("/vendors", async (req, res) => {
  try {
    const sorted = [...getVendors()].sort((a, b) => a.complianceScore - b.complianceScore);
    res.status(200).json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /vendor/vendors/:id
router.get("/vendors/:id", async (req, res) => {
  try {
    const vendor = getVendors().find((v) => v._id === req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;