import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import invoiceRoutes from "./routes/invoice.js";
import vendorRoutes  from "./routes/vendor.js";
import alertRoutes   from "./routes/alert.js";
import summaryRoutes from "./routes/summary.js";
import uploadRoutes  from "./routes/upload.js";

dotenv.config();
const app = express();

// ── CORS — must be FIRST so preflight OPTIONS requests are handled ────────────
app.use(
  cors({
    origin: "*",           // tighten to your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Security headers — cross-origin resource policy relaxed for file uploads ─
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ── Body parsers — JSON & URL-encoded only (NOT for multipart — multer handles that) ──
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/invoice", invoiceRoutes);
app.use("/vendor",  vendorRoutes);
app.use("/alert",   alertRoutes);
app.use("/summary", summaryRoutes);
app.use("/upload",  uploadRoutes);   // multer runs inside this router

app.get("/health", (_req, res) =>
  res.json({ status: "ok", product: "GTax AI" })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: err.message ?? "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`GTax AI running on port ${PORT}`);
});