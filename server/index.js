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
import authRoutes    from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/invoice", invoiceRoutes);
app.use("/vendor",  vendorRoutes);
app.use("/alert",   alertRoutes);
app.use("/summary", summaryRoutes);
app.use("/upload",  uploadRoutes);
app.use("/auth",    authRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", product: "GTax AI" }));

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: err.message ?? "Internal server error" });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`GTax AI running on port ${PORT}`));