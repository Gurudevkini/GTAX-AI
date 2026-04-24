const fs = require('fs');
const path = require('path');

const TOTAL_INVOICES = 1000;
const MISMATCH_COUNT = 25;
const PENDING_COUNT = 25;
const MATCHED_COUNT = TOTAL_INVOICES - MISMATCH_COUNT - PENDING_COUNT;

const VENDORS = [
  { name: "TechNova Solutions", gstin: "27AADCT1234E1Z1" },
  { name: "Global Corp", gstin: "22BBBB0000A1Z5" },
  { name: "Apex Logistics", gstin: "21CCCC1111A1Z2" },
  { name: "Prime Steels", gstin: "33EEEE3333A1Z4" },
  { name: "Nexus Traders", gstin: "09GGGG5555A1Z7" },
  { name: "Dynamic Dealers", gstin: "24DDDD2222A1Z3" },
  { name: "Rapid Delivery", gstin: "14FFFF4444A1Z6" },
  { name: "Alpha Constructions", gstin: "11AAAA1111A1Z8" },
  { name: "Beta Services", gstin: "12BBBB2222A1Z9" },
  { name: "Gamma Electronics", gstin: "13CCCC3333A1Z0" }
];

const MOCK_INVOICES = [];
const MOCK_VENDORS_MAP = {};

let totalITC = 0;
let itcAtRisk = 0;
let gstPayable = 0;
const monthlyMap = {};
const riskTrendMap = {};

function getRandomDate() {
  const start = new Date("2023-04-01").getTime();
  const end = new Date("2024-03-31").getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split("T")[0];
}

function getMonthName(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

VENDORS.forEach(v => {
  MOCK_VENDORS_MAP[v.gstin] = { 
    _id: `vendor_${v.gstin}`, 
    name: v.name, 
    gstin: v.gstin, 
    totalInvoices: 0, 
    mismatchCount: 0 
  };
});

let statusArray = [
  ...Array(MATCHED_COUNT).fill("matched"),
  ...Array(MISMATCH_COUNT).fill("mismatch"),
  ...Array(PENDING_COUNT).fill("pending")
];
statusArray = statusArray.sort(() => Math.random() - 0.5);

statusArray.forEach((status, i) => {
  const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];
  const date = getRandomDate();
  const isIgst = Math.random() > 0.5;
  const taxableAmount = Math.floor(1000 + Math.random() * 99000);
  let cgst = 0, sgst = 0, igst = 0;
  
  if (isIgst) {
    igst = Math.floor(taxableAmount * 0.18);
  } else {
    cgst = Math.floor(taxableAmount * 0.09);
    sgst = Math.floor(taxableAmount * 0.09);
  }
  const totalAmount = taxableAmount + cgst + sgst + igst;
  const confidenceScore = status === "matched" ? (90 + Math.floor(Math.random() * 10)) :
                          status === "mismatch" ? (30 + Math.floor(Math.random() * 40)) :
                          (50 + Math.floor(Math.random() * 25));

  const inv = {
    _id: `inv_${i + 1}`,
    invoiceNumber: `INV-${String(i+1).padStart(5, '0')}`,
    vendorName: vendor.name,
    gstin: vendor.gstin,
    date,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalAmount,
    status,
    confidenceScore
  };

  MOCK_INVOICES.push(inv);

  MOCK_VENDORS_MAP[vendor.gstin].totalInvoices++;
  if (status === "mismatch") {
    MOCK_VENDORS_MAP[vendor.gstin].mismatchCount++;
    itcAtRisk += (cgst + sgst + igst);
  }
  totalITC += (cgst + sgst + igst);
  if (status === "matched") {
    gstPayable += taxableAmount * 0.18;
  }

  const month = getMonthName(date);
  if (!monthlyMap[month]) monthlyMap[month] = { month, matched: 0, mismatch: 0, pending: 0, _ts: new Date(date).setDate(1) };
  if (status === "matched") monthlyMap[month].matched++;
  if (status === "mismatch") monthlyMap[month].mismatch++;
  if (status === "pending") monthlyMap[month].pending++;

  if (status === "mismatch") {
    if (!riskTrendMap[month]) riskTrendMap[month] = { month, amount: 0, _ts: new Date(date).setDate(1) };
    riskTrendMap[month].amount += (cgst + sgst + igst);
  }
});

const monthlyReconciliation = Object.values(monthlyMap).sort((a,b) => a._ts - b._ts).map(({_ts, ...rest}) => rest);
const itcRiskTrend = Object.values(riskTrendMap).sort((a,b) => a._ts - b._ts).map(({_ts, ...rest}) => rest);

const MOCK_VENDORS = Object.values(MOCK_VENDORS_MAP).map(v => {
  const score = Math.max(0, 100 - (v.mismatchCount / v.totalInvoices) * 200);
  v.complianceScore = Math.floor(score);
  v.riskLevel = v.complianceScore >= 80 ? "Low" : v.complianceScore >= 50 ? "Medium" : "High";
  return v;
});

const matchRatio = MATCHED_COUNT / TOTAL_INVOICES;
const itcRatio = totalITC > 0 ? (totalITC - itcAtRisk) / totalITC : 1;
const healthScore = Math.floor((matchRatio * 50) + (itcRatio * 50));

const MOCK_SUMMARY = {
  period: "FY 2023-24",
  totalInvoices: TOTAL_INVOICES,
  matchedInvoices: MATCHED_COUNT,
  mismatchedInvoices: MISMATCH_COUNT,
  pendingInvoices: PENDING_COUNT,
  totalITC: Math.floor(totalITC),
  itcAtRisk: Math.floor(itcAtRisk),
  gstPayable: Math.floor(gstPayable),
  healthScore,
  monthlyReconciliation,
  itcRiskTrend
};

const MOCK_ALERTS = [];
if (MISMATCH_COUNT > 0) {
  MOCK_ALERTS.push({
    _id: "a1",
    type: "ITC_MISMATCH",
    message: `${MISMATCH_COUNT} invoice(s) mismatched. ₹${(itcAtRisk / 100000).toFixed(2)}L ITC at risk.`,
    severity: itcAtRisk > 50000 ? "High" : "Medium",
    date: new Date().toISOString().split("T")[0],
    status: "open",
  });
}
if (PENDING_COUNT > 0) {
  MOCK_ALERTS.push({
    _id: "a3",
    type: "RECONCILE",
    message: `${PENDING_COUNT} invoice(s) pending reconciliation against GSTR-2B.`,
    severity: "Medium",
    date: new Date().toISOString().split("T")[0],
    status: "open",
  });
}
MOCK_VENDORS.filter(v => v.riskLevel === "High").slice(0, 5).forEach((v, i) => {
  MOCK_ALERTS.push({
    _id: `a_v_${i}`,
    type: "VENDOR_RISK",
    message: `Vendor "${v.name}" has compliance score ${v.complianceScore}/100 — ${v.mismatchCount} mismatch(es).`,
    severity: "High",
    date: new Date().toISOString().split("T")[0],
    status: "open",
  });
});

const outContent = `// ─── Rich mock data used as fallback when server returns no data ──────────────
// This ensures the demo always looks impressive regardless of server state.

export const MOCK_SUMMARY = ${JSON.stringify(MOCK_SUMMARY, null, 2)};

export const MOCK_ALERTS = ${JSON.stringify(MOCK_ALERTS, null, 2)};

export const MOCK_INVOICES = ${JSON.stringify(MOCK_INVOICES, null, 2)};

export const MOCK_VENDORS = ${JSON.stringify(MOCK_VENDORS, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'client', 'src', 'state', 'mockData.ts'), outContent);
console.log('Successfully generated large mockData.ts');
