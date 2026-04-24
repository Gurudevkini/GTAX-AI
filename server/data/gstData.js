/**
 * GTax AI — Central In-Memory Data Store
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

// ─── Getter functions ─────────────────────────────────────────────────────────
export const getInvoices = () => store.invoices;
export const getVendors  = () => store.vendors;
export const getAlerts   = () => store.alerts;

// ─── Flexible column detectors ───────────────────────────────────────────────

function normalize(str) {
  return String(str).toLowerCase().replace(/[\s_\-]/g, "");
}

function detectColumn(row, ...candidates) {
  for (const candidate of candidates) {
    const found = Object.keys(row).find(
      (k) => normalize(k) === normalize(candidate)
    );
    if (found !== undefined && row[found] !== "" && row[found] != null) {
      return row[found];
    }
  }
  return null;
}

function detectAmount(row, ...candidates) {
  const val = detectColumn(row, ...candidates);
  if (val !== null) return parseFloat(val) || 0;
  // fallback: first positive numeric value in row
  const numericVal = Object.values(row).find(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0
  );
  return numericVal ? parseFloat(numericVal) : 0;
}

function detectString(row, ...candidates) {
  const val = detectColumn(row, ...candidates);
  if (val !== null) return String(val).trim();
  // fallback: first non-numeric non-empty string
  const strVal = Object.values(row).find(
    (v) => isNaN(parseFloat(v)) && String(v).trim() !== ""
  );
  return strVal ? String(strVal).trim() : "";
}

function detectDate(row, ...candidates) {
  const val = detectColumn(row, ...candidates);
  if (val) {
    const d = new Date(val);
    if (!isNaN(d)) return d.toISOString().split("T")[0];
  }
  // fallback: find first date-like value in row
  const dateVal = Object.values(row).find((v) => {
    const s = String(v);
    return (s.includes("-") || s.includes("/")) && !isNaN(new Date(s));
  });
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d)) return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

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
    .filter((inv) => inv.status === "mismatch" || inv.status === "pending")
    .forEach((inv) => {
      const d = new Date(inv.date);
      if (isNaN(d)) return;
      const month = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      if (!map[month]) map[month] = { month, amount: 0, _ts: d.getTime() };
      const tax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
      // if no tax columns found, estimate 18% of total
      map[month].amount += tax > 0 ? tax : inv.totalAmount * 0.18;
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

// ─── Setters ──────────────────────────────────────────────────────────────────
export function setInvoices(rows) {
  store.invoices = rows.map((row, i) => {
    const totalAmount = detectAmount(
      row,
      "totalamount", "invoicevalue", "invoiceamount",
      "amount", "value", "total", "grandtotal", "netamount"
    );

    const taxableAmount = detectAmount(
      row,
      "taxableamount", "taxablevalue", "taxable",
      "baseamount", "assessablevalue"
    ) || totalAmount / 1.18;

    const cgst = detectAmount(row, "cgst", "centralgst");
    const sgst = detectAmount(row, "sgst", "stategst");
    const igst = detectAmount(row, "igst", "integratedgst");

    const gstin = detectString(
      row,
      "gstin", "suppliergstin", "gstno", "gstnumber",
      "gstin/uin", "vendorgstin", "partygstin"
    );

    const vendorName = detectString(
      row,
      "vendorname", "suppliername", "partyname",
      "vendor", "supplier", "party", "name",
      "tradename", "legalname"
    ) || `Vendor ${i + 1}`;

    const invoiceNum = detectString(
      row,
      "invoicenumber", "invoiceno", "invoicenum",
      "docno", "documentnumber", "billno",
      "invoice", "number", "id", "referenceno"
    ) || `INV-${i + 1}`;

    const date = detectDate(
      row,
      "date", "invoicedate", "docdate",
      "billdate", "transactiondate", "taxdate"
    );

    // if no amount detected at all, use row index as dummy so charts render
    const finalAmount  = totalAmount   > 0 ? totalAmount   : (i + 1) * 1000;
    const finalTaxable = taxableAmount > 0 ? taxableAmount : finalAmount / 1.18;
    const finalCGST    = cgst > 0 ? cgst : (igst === 0 ? finalTaxable * 0.09 : 0);
    const finalSGST    = sgst > 0 ? sgst : (igst === 0 ? finalTaxable * 0.09 : 0);
    const finalIGST    = igst > 0 ? igst : (cgst === 0 && sgst === 0 ? finalTaxable * 0.18 : 0);

    const g2b = store.gstr2b.find((g) => {
      const g2bNum = String(g["Invoice Number"] || "");
      const g2bGst = String(g["GSTIN"] || "");
      const g2bAmt = parseFloat(g["Total Amount"] || 0);
      return (
        g2bNum.toLowerCase() === invoiceNum.toLowerCase() ||
        (g2bGst.toLowerCase() === gstin.toLowerCase() &&
          finalAmount > 0 &&
          Math.abs(g2bAmt - finalAmount) / finalAmount < 0.02)
      );
    });

    const recon = reconcileInvoice(
      {
        totalAmount:   finalAmount,
        cgst:          finalCGST,
        sgst:          finalSGST,
        igst:          finalIGST,
        taxableAmount: finalTaxable,
      },
      g2b
        ? {
            totalAmount: parseFloat(g2b["Total Amount"] || 0),
            cgst:        parseFloat(g2b["CGST"]         || 0),
            sgst:        parseFloat(g2b["SGST"]         || 0),
            igst:        parseFloat(g2b["IGST"]         || 0),
          }
        : null
    );

    const status          = store.gstr2b.length === 0 ? "pending" : recon.status;
    const confidenceScore = store.gstr2b.length === 0 ? 70        : recon.confidenceScore;

    return {
      _id:           `inv_${i + 1}`,
      invoiceNumber: invoiceNum,
      vendorName,
      gstin,
      date,
      taxableAmount: finalTaxable,
      cgst:          finalCGST,
      sgst:          finalSGST,
      igst:          finalIGST,
      totalAmount:   finalAmount,
      status,
      confidenceScore,
    };
  });
  rebuildDerived();
}

export function setGstr2b(rows) {
  // Normalize to standard keys regardless of input column names
  store.gstr2b = rows.map((row) => ({
    "Invoice Number": detectString(row,
      "invoicenumber", "invoiceno", "invoicenum",
      "docno", "documentnumber", "billno",
      "invoice", "number", "id", "referenceno"
    ) || "",
    "GSTIN": detectString(row,
      "gstin", "suppliergstin", "gstno",
      "gstnumber", "gstin/uin"
    ) || "",
    "Total Amount": String(detectAmount(row,
      "totalamount", "invoicevalue", "invoiceamount",
      "amount", "value", "total", "grandtotal"
    )),
    "CGST": String(detectAmount(row, "cgst", "centralgst")),
    "SGST": String(detectAmount(row, "sgst", "stategst")),
    "IGST": String(detectAmount(row, "igst", "integratedgst")),
  }));

  // Re-reconcile existing invoices against new GSTR-2B
  if (store.invoices.length > 0) {
    store.invoices = store.invoices.map((inv) => {
      const g2b = store.gstr2b.find((g) => {
        const g2bNum = String(g["Invoice Number"] || "");
        const g2bGst = String(g["GSTIN"] || "");
        const g2bAmt = parseFloat(g["Total Amount"] || 0);
        return (
          g2bNum.toLowerCase() === inv.invoiceNumber.toLowerCase() ||
          (g2bGst.toLowerCase() === inv.gstin.toLowerCase() &&
            inv.totalAmount > 0 &&
            Math.abs(g2bAmt - inv.totalAmount) / inv.totalAmount < 0.02)
        );
      });

      const recon = reconcileInvoice(
        {
          totalAmount:   inv.totalAmount,
          cgst:          inv.cgst,
          sgst:          inv.sgst,
          igst:          inv.igst,
          taxableAmount: inv.taxableAmount,
        },
        g2b
          ? {
              totalAmount: parseFloat(g2b["Total Amount"] || 0),
              cgst:        parseFloat(g2b["CGST"]         || 0),
              sgst:        parseFloat(g2b["SGST"]         || 0),
              igst:        parseFloat(g2b["IGST"]         || 0),
            }
          : null
      );

      return { ...inv, status: recon.status, confidenceScore: recon.confidenceScore };
    });

    rebuildDerived();
  }
}