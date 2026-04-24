import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gstin: { type: String, required: true, unique: true },
    complianceScore: { type: Number, min: 0, max: 100, default: 50 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    totalInvoices: { type: Number, default: 0 },
    mismatchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", VendorSchema);
export default Vendor;