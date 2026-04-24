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

    // Always allow by extension — MIME type is unreliable across browsers/OS.
    // e.g. Chrome on Windows sends text/plain for CSV; some OS sends "".
    if (allowedExts.includes(ext)) {
      return cb(null, true);
    }

    cb(new Error(`Unsupported file type "${ext}". Use .csv, .xlsx, or .xls`));
  },
});

// ── Parse Excel / CSV buffer into row objects ─────────────────────────────────
function parseFileBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return { sheetName, rowCount: rows.length, rows };
}

// ── POST /upload/invoices  |  POST /upload/gstr2b ─────────────────────────────
//
// Using the callback form of upload.single() so multer errors (wrong MIME,
// file too large, etc.) are caught and returned as proper JSON — not 500 crashes.
//
router.post("/:type", (req, res) => {
  const { type } = req.params;

  if (!["invoices", "gstr2b"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Type must be 'invoices' or 'gstr2b'" });
  }

  // Run multer manually so we can intercept its errors
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