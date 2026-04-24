import express from "express";
import { getInvoices } from "../data/gstData.js";

const router = express.Router();

// GET /invoice/invoices
router.get("/invoices", async (req, res) => {
  try {
    res.status(200).json(getInvoices());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /invoice/invoices/:id
router.get("/invoices/:id", async (req, res) => {
  try {
    const inv = getInvoices().find((i) => i._id === req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json(inv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /invoice/reconcile
router.post("/reconcile", async (req, res) => {
  try {
    const invoices = getInvoices();
    const results = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      status: inv.status,
      confidenceScore: inv.confidenceScore,
      totalAmount: inv.totalAmount,
    }));
    const summary = {
      total: invoices.length,
      matched: invoices.filter((i) => i.status === "matched").length,
      mismatch: invoices.filter((i) => i.status === "mismatch").length,
      pending: invoices.filter((i) => i.status === "pending").length,
    };
    res.status(200).json({ results, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;