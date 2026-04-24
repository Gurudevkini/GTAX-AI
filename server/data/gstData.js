/**
 * GTax AI — Central In-Memory Data Store
 *
 * Routes import getter functions (getInvoices / getVendors / getAlerts)
 * so they always read the current mutable state — no stale snapshots.
 */

import {
  reconcileInvoice,
  calcVendorComplianceScore,
  vendorRiskLevel,
  calcTotalITC,
  calcITCAtRisk,
  calcHealthScore,
} from "../utils/gstLogic.js";

// ─── Single mutable store object ─────────────────────────────────────────────
export const store = {
  invoices: [],
  vendors:  [],
  alerts:   [],
  gstr2b:   [],
};

// ─── Getter functions (used by routes) ───────────────────────────────────────
export const getInvoices = () => store.invoices;
export const getVendors  = () => store.vendors;
export const getAlerts   = () => store.alerts;

// ─── Internal builders ────────────────────────────────────────────────────────

function buildVendors(invList) {
  const map = {};
  invList.forEach((inv) => {
    const key = inv.gstin || inv.vendorName;
    if (!map[key]) {
      map[key] = {
        _id: `vendor_${key}`,
        name: inv.vendorName || "Unknown",
        gstin: inv.gstin || key,
        totalInvoices: 0,
        mismatchCount: 0,
      };
    }
    map[key].totalInvoices++;
    if (inv.status === "mismatch") map[key].mismatchCount++;
  });
  return Object.values(map).map((v) => {
    const score = calcVendorComplianceScore(v);
    return { ...v, complianceScore: score, riskLevel: vendorRiskLevel(score) };
  });
}

function buildAlerts(invList, vendorList) {
  const result = [];
  let idx = 1;

  const mismatched = invList.filter((i) => i.status === "mismatch");
  if (mismatched.length > 0) {
    const itcRisk = calcITCAtRisk(invList);
    result.push({
      _id: `alert_${idx++}`,
      type: "ITC_MISMATCH",
      message: `${mismatched.length} invoice(s) mismatched. ₹${(itcRisk / 100000).toFixed(2)}L ITC at risk.`,
      severity: itcRisk > 50000 ? "High" : "Medium",
      date: new Date().toISOString().split("T")[0],
      status: "open",
    });
  }

  vendorList.filter((v) => v.riskLevel === "High").forEach((v) => {
    result.push({
      _id: `alert_${idx++}`,
      type: "VENDOR_RISK",
      message: `Vendor "${v.name}" has compliance score ${v.complianceScore}/100 — ${v.mismatchCount} mismatch(es).`,
      severity: "High",
      date: new Date().toISOString().split("T")[0],
      status: "open",
    });
  });

  const pending = invList.filter((i) => i.status === "pending");
  if (pending.length > 0) {
    result.push({
      _id: `alert_${idx++}`,
      type: "RECONCILE",
      message: `${pending.length} invoice(s) pending reconciliation against GSTR-2B.`,
      severity: "Medium",
      date: new Date().toISOString().split("T")[0],
      status: "open",
    });
  }

  return result;
}

function buildMonthlyReconciliation(invList) {
  const map = {};
  invList.forEach((inv) => {
    const d = new Date(inv.date);
    if (isNaN(d)) return;
    const month = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (!map[month]) map[month] = { month, matched: 0, mismatch: 0, pending: 0, _ts: d.getTime() };
    if (inv.status === "matched")       map[month].matched++;
    else if (inv.status === "mismatch") map[month].mismatch++;
    else                                map[month].pending++;
  });
  return Object.values(map)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest);
}

function buildITCRiskTrend(invList) {
  const map = {};
  invList
    .filter((inv) => inv.status === "mismatch")
    .forEach((inv) => {
      const d = new Date(inv.date);
      if (isNaN(d)) return;
      const month = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      if (!map[month]) map[month] = { month, amount: 0, _ts: d.getTime() };
      map[month].amount += (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
    });
  return Object.values(map)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest);
}

function rebuildDerived() {
  store.vendors = buildVendors(store.invoices);
  store.alerts  = buildAlerts(store.invoices, store.vendors);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function getComputedSummary() {
  const inv                = store.invoices;
  const totalInvoices      = inv.length;
  const matchedInvoices    = inv.filter((i) => i.status === "matched").length;
  const mismatchedInvoices = inv.filter((i) => i.status === "mismatch").length;
  const pendingInvoices    = inv.filter((i) => i.status === "pending").length;
  const totalITC           = calcTotalITC(inv);
  const itcAtRisk          = calcITCAtRisk(inv);
  const gstPayable         = inv
    .filter((i) => i.status === "matched")
    .reduce((s, i) => s + (i.taxableAmount || 0) * 0.18, 0);
  const healthScore        = calcHealthScore(totalInvoices, matchedInvoices, totalITC, itcAtRisk);

  return {
    period: "FY 2024-25",
    totalInvoices,
    matchedInvoices,
    mismatchedInvoices,
    pendingInvoices,
    totalITC,
    itcAtRisk,
    gstPayable,
    healthScore,
    monthlyReconciliation: buildMonthlyReconciliation(inv),
    itcRiskTrend: buildITCRiskTrend(inv),
  };
}

// ─── Setters (called by upload route) ─────────────────────────────────────────
export function setInvoices(rows) {
  store.invoices = rows.map((row, i) => {
    const totalAmount   = parseFloat(row["Total Amount"]   || row["total_amount"]   || row["totalAmount"]   || row["Invoice Value"] || 0);
    const taxableAmount = parseFloat(row["Taxable Amount"]  || row["taxable_amount"]  || row["taxableAmount"]  || row["Taxable Value"] || totalAmount / 1.18);
    const cgst          = parseFloat(row["CGST"]  || row["cgst"]  || 0);
    const sgst          = parseFloat(row["SGST"]  || row["sgst"]  || 0);
    const igst          = parseFloat(row["IGST"]  || row["igst"]  || 0);
    const gstin         = String(row["GSTIN"]          || row["gstin"]          || row["Supplier GSTIN"] || "");
    const vendorName    = String(row["Vendor Name"]    || row["vendor_name"]    || row["Supplier Name"]  || row["Party Name"]     || `Vendor ${i + 1}`);
    const invoiceNum    = String(row["Invoice Number"] || row["invoice_number"] || row["Invoice No"]     || row["Doc No"]         || `INV-${i + 1}`);
    const dateRaw       = row["Date"] || row["date"] || row["Invoice Date"] || row["Doc Date"] || "";
    const date          = dateRaw
      ? new Date(dateRaw).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const g2b = store.gstr2b.find((g) => {
      const g2bNum = String(g["Invoice Number"] || g["invoice_number"] || g["Doc No"] || "");
      const g2bGst = String(g["GSTIN"] || g["gstin"] || "");
      const g2bAmt = parseFloat(g["Total Amount"] || g["total_amount"] || g["Invoice Value"] || 0);
      return (
        g2bNum.toLowerCase() === invoiceNum.toLowerCase() ||
        (g2bGst.toLowerCase() === gstin.toLowerCase() &&
          totalAmount > 0 &&
          Math.abs(g2bAmt - totalAmount) / totalAmount < 0.02)
      );
    });

    const recon = reconcileInvoice(
      { totalAmount, cgst, sgst, igst, taxableAmount },
      g2b
        ? {
            totalAmount: parseFloat(g2b["Total Amount"] || g2b["total_amount"] || g2b["Invoice Value"] || 0),
            cgst: parseFloat(g2b["CGST"] || g2b["cgst"] || 0),
            sgst: parseFloat(g2b["SGST"] || g2b["sgst"] || 0),
            igst: parseFloat(g2b["IGST"] || g2b["igst"] || 0),
          }
        : null
    );

    const status          = store.gstr2b.length === 0 ? "pending"  : recon.status;
    const confidenceScore = store.gstr2b.length === 0 ? 70         : recon.confidenceScore;

    return {
      _id: `inv_${i + 1}`,
      invoiceNumber: invoiceNum,
      vendorName,
      gstin,
      date,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
      status,
      confidenceScore,
    };
  });
  rebuildDerived();
}

export function setGstr2b(rows) {
  store.gstr2b = rows;
  // Re-reconcile existing invoices against new GSTR-2B data
  if (store.invoices.length > 0) {
    setInvoices(
      store.invoices.map((inv) => ({
        "Invoice Number": inv.invoiceNumber,
        "Vendor Name":    inv.vendorName,
        "GSTIN":          inv.gstin,
        "Date":           inv.date,
        "Taxable Amount": inv.taxableAmount,
        "CGST":           inv.cgst,
        "SGST":           inv.sgst,
        "IGST":           inv.igst,
        "Total Amount":   inv.totalAmount,
      }))
    );
  }
}

// ─── Pre-load mock data so charts populate immediately on startup ──────────────
store.gstr2b = [
  { "Invoice Number": "INV-2023-001", "GSTIN": "27AADCT1234E1Z1", "Invoice Value": "50000",  "CGST": "3814",  "SGST": "3814",  "IGST": "0" },
  { "Invoice Number": "INV-2023-002", "GSTIN": "22BBBB0000A1Z5",  "Invoice Value": "100000", "CGST": "0",     "SGST": "0",     "IGST": "15254" },
  { "Invoice Number": "INV-2023-004", "GSTIN": "33EEEE3333A1Z4",  "Invoice Value": "78000",  "CGST": "6000",  "SGST": "6000",  "IGST": "0" },
  { "Invoice Number": "INV-2023-005", "GSTIN": "09GGGG5555A1Z7",  "Invoice Value": "20000",  "CGST": "0",     "SGST": "0",     "IGST": "3051" },
  { "Invoice Number": "INV-2023-006", "GSTIN": "27AADCT1234E1Z1", "Invoice Value": "60000",  "CGST": "4576",  "SGST": "4576",  "IGST": "0" },
  { "Invoice Number": "INV-2023-007", "GSTIN": "24DDDD2222A1Z3",  "Invoice Value": "40000",  "CGST": "0",     "SGST": "0",     "IGST": "6102" },
  { "Invoice Number": "INV-2023-009", "GSTIN": "14FFFF4444A1Z6",  "Invoice Value": "95000",  "CGST": "7500",  "SGST": "7500",  "IGST": "0" },
  { "Invoice Number": "INV-2023-010", "GSTIN": "22BBBB0000A1Z5",  "Invoice Value": "70000",  "CGST": "0",     "SGST": "0",     "IGST": "10678" },
  { "Invoice Number": "INV-2024-001", "GSTIN": "33EEEE3333A1Z4",  "Invoice Value": "36000",  "CGST": "2746",  "SGST": "2746",  "IGST": "0" },
  { "Invoice Number": "INV-2024-002", "GSTIN": "27AADCT1234E1Z1", "Invoice Value": "85000",  "CGST": "6483",  "SGST": "6483",  "IGST": "0" },
  { "Invoice Number": "INV-2024-003", "GSTIN": "09GGGG5555A1Z7",  "Invoice Value": "50000",  "CGST": "0",     "SGST": "0",     "IGST": "7627" },
  { "Invoice Number": "INV-2024-005", "GSTIN": "14FFFF4444A1Z6",  "Invoice Value": "100000", "CGST": "0",     "SGST": "0",     "IGST": "15254" },
  { "Invoice Number": "INV-2024-006", "GSTIN": "21CCCC1111A1Z2",  "Invoice Value": "40000",  "CGST": "3051",  "SGST": "3051",  "IGST": "0" },
  { "Invoice Number": "INV-2024-007", "GSTIN": "22BBBB0000A1Z5",  "Invoice Value": "65000",  "CGST": "0",     "SGST": "0",     "IGST": "9915" },
  { "Invoice Number": "INV-2024-008", "GSTIN": "27AADCT1234E1Z1", "Invoice Value": "52000",  "CGST": "4000",  "SGST": "4000",  "IGST": "0" },
  { "Invoice Number": "INV-2024-009", "GSTIN": "33EEEE3333A1Z4",  "Invoice Value": "80000",  "CGST": "0",     "SGST": "0",     "IGST": "12203" },
  { "Invoice Number": "INV-2024-010", "GSTIN": "09GGGG5555A1Z7",  "Invoice Value": "25000",  "CGST": "1907",  "SGST": "1907",  "IGST": "0" },
  { "Invoice Number": "INV-2024-011", "GSTIN": "24DDDD2222A1Z3",  "Invoice Value": "70000",  "CGST": "5339",  "SGST": "5339",  "IGST": "0" },
  { "Invoice Number": "INV-2024-012", "GSTIN": "14FFFF4444A1Z6",  "Invoice Value": "85000",  "CGST": "0",     "SGST": "0",     "IGST": "12966" },
  { "Invoice Number": "INV-2024-013", "GSTIN": "27AADCT1234E1Z1", "Invoice Value": "40000",  "CGST": "3051",  "SGST": "3051",  "IGST": "0" },
  { "Invoice Number": "INV-2024-015", "GSTIN": "22BBBB0000A1Z5",  "Invoice Value": "120000", "CGST": "9153",  "SGST": "9153",  "IGST": "0" },
];

setInvoices([
  { "Invoice Number": "INV-2023-001", "Vendor Name": "TechNova Solutions", "GSTIN": "27AADCT1234E1Z1", "Date": "2023-11-03", "Taxable Amount": "42372",  "CGST": "3814", "SGST": "3814", "IGST": "0",     "Total Amount": "50000"  },
  { "Invoice Number": "INV-2023-002", "Vendor Name": "Global Corp",         "GSTIN": "22BBBB0000A1Z5", "Date": "2023-11-08", "Taxable Amount": "84746",  "CGST": "0",    "SGST": "0",    "IGST": "15254", "Total Amount": "100000" },
  { "Invoice Number": "INV-2023-003", "Vendor Name": "Apex Logistics",      "GSTIN": "21CCCC1111A1Z2", "Date": "2023-11-12", "Taxable Amount": "25000",  "CGST": "2250", "SGST": "2250", "IGST": "0",     "Total Amount": "29500"  },
  { "Invoice Number": "INV-2023-004", "Vendor Name": "Prime Steels",        "GSTIN": "33EEEE3333A1Z4", "Date": "2023-11-18", "Taxable Amount": "63559",  "CGST": "5720", "SGST": "5720", "IGST": "0",     "Total Amount": "75000"  },
  { "Invoice Number": "INV-2023-005", "Vendor Name": "Nexus Traders",       "GSTIN": "09GGGG5555A1Z7", "Date": "2023-11-22", "Taxable Amount": "16949",  "CGST": "0",    "SGST": "0",    "IGST": "3051",  "Total Amount": "20000"  },
  { "Invoice Number": "INV-2023-006", "Vendor Name": "TechNova Solutions",  "GSTIN": "27AADCT1234E1Z1", "Date": "2023-12-04", "Taxable Amount": "50847",  "CGST": "4576", "SGST": "4576", "IGST": "0",     "Total Amount": "60000"  },
  { "Invoice Number": "INV-2023-007", "Vendor Name": "Dynamic Dealers",     "GSTIN": "24DDDD2222A1Z3", "Date": "2023-12-10", "Taxable Amount": "33898",  "CGST": "0",    "SGST": "0",    "IGST": "6102",  "Total Amount": "40000"  },
  { "Invoice Number": "INV-2023-008", "Vendor Name": "Apex Logistics",      "GSTIN": "21CCCC1111A1Z2", "Date": "2023-12-15", "Taxable Amount": "21186",  "CGST": "1907", "SGST": "1907", "IGST": "0",     "Total Amount": "25000"  },
  { "Invoice Number": "INV-2023-009", "Vendor Name": "Rapid Delivery",      "GSTIN": "14FFFF4444A1Z6", "Date": "2023-12-20", "Taxable Amount": "76271",  "CGST": "6864", "SGST": "6864", "IGST": "0",     "Total Amount": "90000"  },
  { "Invoice Number": "INV-2023-010", "Vendor Name": "Global Corp",         "GSTIN": "22BBBB0000A1Z5", "Date": "2023-12-28", "Taxable Amount": "59322",  "CGST": "0",    "SGST": "0",    "IGST": "10678", "Total Amount": "70000"  },
  { "Invoice Number": "INV-2024-001", "Vendor Name": "Prime Steels",        "GSTIN": "33EEEE3333A1Z4", "Date": "2024-01-05", "Taxable Amount": "30508",  "CGST": "2746", "SGST": "2746", "IGST": "0",     "Total Amount": "36000"  },
  { "Invoice Number": "INV-2024-002", "Vendor Name": "TechNova Solutions",  "GSTIN": "27AADCT1234E1Z1", "Date": "2024-01-10", "Taxable Amount": "72034",  "CGST": "6483", "SGST": "6483", "IGST": "0",     "Total Amount": "85000"  },
  { "Invoice Number": "INV-2024-003", "Vendor Name": "Nexus Traders",       "GSTIN": "09GGGG5555A1Z7", "Date": "2024-01-14", "Taxable Amount": "42373",  "CGST": "0",    "SGST": "0",    "IGST": "7627",  "Total Amount": "50000"  },
  { "Invoice Number": "INV-2024-004", "Vendor Name": "Dynamic Dealers",     "GSTIN": "24DDDD2222A1Z3", "Date": "2024-01-20", "Taxable Amount": "25424",  "CGST": "2288", "SGST": "2288", "IGST": "0",     "Total Amount": "30000"  },
  { "Invoice Number": "INV-2024-005", "Vendor Name": "Rapid Delivery",      "GSTIN": "14FFFF4444A1Z6", "Date": "2024-01-25", "Taxable Amount": "84746",  "CGST": "0",    "SGST": "0",    "IGST": "15254", "Total Amount": "100000" },
  { "Invoice Number": "INV-2024-006", "Vendor Name": "Apex Logistics",      "GSTIN": "21CCCC1111A1Z2", "Date": "2024-02-03", "Taxable Amount": "33898",  "CGST": "3051", "SGST": "3051", "IGST": "0",     "Total Amount": "40000"  },
  { "Invoice Number": "INV-2024-007", "Vendor Name": "Global Corp",         "GSTIN": "22BBBB0000A1Z5", "Date": "2024-02-10", "Taxable Amount": "55085",  "CGST": "0",    "SGST": "0",    "IGST": "9915",  "Total Amount": "65000"  },
  { "Invoice Number": "INV-2024-008", "Vendor Name": "TechNova Solutions",  "GSTIN": "27AADCT1234E1Z1", "Date": "2024-02-15", "Taxable Amount": "42373",  "CGST": "3814", "SGST": "3814", "IGST": "0",     "Total Amount": "50000"  },
  { "Invoice Number": "INV-2024-009", "Vendor Name": "Prime Steels",        "GSTIN": "33EEEE3333A1Z4", "Date": "2024-02-22", "Taxable Amount": "67797",  "CGST": "0",    "SGST": "0",    "IGST": "12203", "Total Amount": "80000"  },
  { "Invoice Number": "INV-2024-010", "Vendor Name": "Nexus Traders",       "GSTIN": "09GGGG5555A1Z7", "Date": "2024-02-28", "Taxable Amount": "21186",  "CGST": "1907", "SGST": "1907", "IGST": "0",     "Total Amount": "25000"  },
  { "Invoice Number": "INV-2024-011", "Vendor Name": "Dynamic Dealers",     "GSTIN": "24DDDD2222A1Z3", "Date": "2024-03-06", "Taxable Amount": "59322",  "CGST": "5339", "SGST": "5339", "IGST": "0",     "Total Amount": "70000"  },
  { "Invoice Number": "INV-2024-012", "Vendor Name": "Rapid Delivery",      "GSTIN": "14FFFF4444A1Z6", "Date": "2024-03-12", "Taxable Amount": "72034",  "CGST": "0",    "SGST": "0",    "IGST": "12966", "Total Amount": "85000"  },
  { "Invoice Number": "INV-2024-013", "Vendor Name": "TechNova Solutions",  "GSTIN": "27AADCT1234E1Z1", "Date": "2024-03-18", "Taxable Amount": "33898",  "CGST": "3051", "SGST": "3051", "IGST": "0",     "Total Amount": "40000"  },
  { "Invoice Number": "INV-2024-014", "Vendor Name": "Apex Logistics",      "GSTIN": "21CCCC1111A1Z2", "Date": "2024-03-25", "Taxable Amount": "16949",  "CGST": "0",    "SGST": "0",    "IGST": "3051",  "Total Amount": "20000"  },
  { "Invoice Number": "INV-2024-015", "Vendor Name": "Global Corp",         "GSTIN": "22BBBB0000A1Z5", "Date": "2024-03-31", "Taxable Amount": "101695", "CGST": "9153", "SGST": "9153", "IGST": "0",     "Total Amount": "120000" },
]);