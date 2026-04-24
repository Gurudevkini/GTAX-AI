import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import { setInvoices, setGstr2b, getInvoices } from "../data/gstData.js";

const router = express.Router();

// ── Multer — memory storage, 10 MB limit ─────────────────────────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    const allowedExts = [".csv", ".xlsx", ".xls"];
    if (allowedExts.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type "${ext}". Use .csv, .xlsx, or .xls`));
  },
});

// ── Parse Excel / CSV buffer → row objects ────────────────────────────────────
// KEY FIX: cellDates:true tells XLSX to convert Excel date serial numbers
// (e.g. 45291) into real JavaScript Date objects BEFORE we call sheet_to_json.
// Without this, new Date(45291) = 45 seconds after Unix epoch = "Jan 1970".
function parseFileBuffer(buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,   // ← THE FIX: Excel date serials → JS Date objects
    cellNF: false,
    cellText: false,
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // raw:false ensures date cells that XLSX parsed as Date objects stay as
  // Date objects (not turned back into serial numbers by sheet_to_json).
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  return { sheetName, rowCount: rows.length, rows };
}

// ── POST /upload/reset ────────────────────────────────────────────────────────
router.post("/reset", (_req, res) => {
  try {
    setInvoices([]);
    setGstr2b([]);
    res.status(200).json({ success: true, message: "Data cleared successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /upload/invoices  |  POST /upload/gstr2b ─────────────────────────────
router.post("/:type", (req, res) => {
  const { type } = req.params;

  if (!["invoices", "gstr2b"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Type must be 'invoices' or 'gstr2b'" });
  }

  upload.single("file")(req, res, (multerErr) => {
    if (multerErr) {
      console.error("Multer error:", multerErr.message);
      return res.status(400).json({
        success: false,
        message: multerErr.message ?? "File upload error",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'No file received. Make sure the form field is named "file" and Content-Type is multipart/form-data.',
      });
    }

    try {
      const result = parseFileBuffer(req.file.buffer);

      if (type === "invoices") {
        setInvoices(result.rows);
      } else {
        setGstr2b(result.rows);
      }

      return res.status(200).json({
        success: true,
        message: `${type} uploaded and reconciled successfully`,
        type,
        fileName: req.file.originalname,
        sheetName: result.sheetName,
        rowCount: result.rowCount,
        data: getInvoices(),
      });
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      return res.status(500).json({
        success: false,
        message: `Failed to parse file: ${parseErr.message}`,
      });
    }
  });
});

export default router;