import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { useGetGSTSummaryQuery, useGetAlertsQuery, useGetInvoicesQuery } from "@/state/api";
import { Box, Typography, useTheme, Button, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const AlertIcon = ({ severity }: { severity: string }) => {
  if (severity === "High")
    return <ErrorOutlineIcon sx={{ fontSize: "14px", color: "#ff5252", mt: "1px" }} />;
  if (severity === "Medium")
    return <WarningAmberIcon sx={{ fontSize: "14px", color: "#f2b455", mt: "1px" }} />;
  return <InfoOutlinedIcon sx={{ fontSize: "14px", color: "#8884d8", mt: "1px" }} />;
};

// ── PDF Export ────────────────────────────────────────────────────────────────
// Dynamically imports jsPDF + autoTable so the rest of the dashboard stays fast.
const exportAlertsPDF = async (
  alerts: any[],
  invoices: any[],
  summary: any
) => {
  // Dynamic import so we don't bloat the initial bundle
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("en-IN");

  // ── Cover / header ───────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 80, "F");

  doc.setTextColor(18, 239, 232); // teal
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("GST Reconciliation — Alert & Invoice Report", 40, 35);

  doc.setTextColor(180, 195, 215);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${now}`, 40, 52);
  if (summary?.period) doc.text(`Period: ${summary.period}`, 40, 64);

  // ── Summary pills ────────────────────────────────────────────────────────
  let y = 100;
  const summaryItems = [
    { label: "Total Invoices", value: summary?.totalInvoices ?? 0, color: [180, 195, 215] as [number, number, number] },
    { label: "Matched", value: summary?.matchedInvoices ?? 0, color: [18, 239, 200] as [number, number, number] },
    { label: "Mismatched", value: summary?.mismatchedInvoices ?? 0, color: [255, 82, 82] as [number, number, number] },
    { label: "ITC at Risk", value: `₹${((summary?.itcAtRisk ?? 0) / 100000).toFixed(2)}L`, color: [255, 82, 82] as [number, number, number] },
    { label: "Health Score", value: `${summary?.healthScore ?? 0}/100`, color: [104, 112, 250] as [number, number, number] },
  ];

  doc.setFontSize(8);
  summaryItems.forEach((item, i) => {
    const x = 40 + i * 100;
    doc.setFillColor(25, 35, 56);
    doc.roundedRect(x, y, 90, 38, 4, 4, "F");
    doc.setTextColor(...item.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(item.value), x + 45, y + 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 140, 170);
    doc.text(item.label, x + 45, y + 32, { align: "center" });
  });

  y += 58;

  // ── Section: Active Alerts ───────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(20, 30, 50);
  doc.rect(0, y, pageWidth, 22, "F");
  doc.text("Active Alerts", 40, y + 15);
  y += 30;

  const alertRows = alerts.map((a) => [
    a.severity,
    a.message,
    a.date ?? "",
    a.status ?? "open",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Message", "Date", "Status"]],
    body: alertRows,
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [200, 210, 225],
      fillColor: [18, 26, 44],
      lineColor: [35, 50, 80],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 22, 40],
      textColor: [120, 140, 180],
      fontStyle: "bold",
      fontSize: 8,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const sev = data.cell.raw as string;
        if (sev === "High") {
          data.cell.styles.textColor = [255, 82, 82];
          data.cell.styles.fillColor = [50, 18, 18];
          data.cell.styles.fontStyle = "bold";
        } else if (sev === "Medium") {
          data.cell.styles.textColor = [242, 180, 85];
          data.cell.styles.fillColor = [50, 40, 15];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [136, 132, 216];
          data.cell.styles.fillColor = [25, 22, 50];
        }
      }
    },
    margin: { left: 40, right: 40 },
    tableWidth: pageWidth - 80,
  });

  // ── Section: Invoice Ledger ──────────────────────────────────────────────
  const afterAlerts = (doc as any).lastAutoTable.finalY + 20;
  doc.setFillColor(20, 30, 50);
  doc.rect(0, afterAlerts, pageWidth, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Invoice Ledger", 40, afterAlerts + 15);

  const invoiceRows = (invoices ?? []).map((inv: any) => [
    inv.invoiceNumber ?? "",
    inv.vendorName ?? "",
    inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "",
    `₹${(inv.totalAmount ?? 0).toLocaleString("en-IN")}`,
    inv.status ?? "",
    inv.confidenceScore != null ? `${inv.confidenceScore}%` : "",
  ]);

  autoTable(doc, {
    startY: afterAlerts + 28,
    head: [["Invoice #", "Vendor", "Date", "Total (₹)", "Status", "Confidence"]],
    body: invoiceRows,
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [200, 210, 225],
      fillColor: [18, 26, 44],
      lineColor: [35, 50, 80],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 22, 40],
      textColor: [120, 140, 180],
      fontStyle: "bold",
      fontSize: 7.5,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [22, 32, 52] },
    didParseCell: (data) => {
      if (data.section !== "body") return;

      // Status column (index 4) — colour by reconciliation status
      if (data.column.index === 4) {
        const status = (data.cell.raw as string).toLowerCase();
        if (status === "matched") {
          data.cell.styles.textColor = [18, 239, 200];     // teal / green
          data.cell.styles.fillColor = [10, 45, 35];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "mismatch" || status === "mismatched") {
          data.cell.styles.textColor = [255, 82, 82];      // red
          data.cell.styles.fillColor = [50, 18, 18];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "pending") {
          data.cell.styles.textColor = [242, 180, 85];     // yellow
          data.cell.styles.fillColor = [50, 40, 15];
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Confidence column (index 5) — colour by score threshold
      if (data.column.index === 5) {
        const raw = data.cell.raw as string;
        const score = parseInt(raw, 10);
        if (score >= 80) {
          data.cell.styles.textColor = [18, 239, 200];     // green
        } else if (score >= 50) {
          data.cell.styles.textColor = [242, 180, 85];     // yellow
        } else {
          data.cell.styles.textColor = [255, 82, 82];      // red
        }
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 40, right: 40 },
    tableWidth: pageWidth - 80,
  });

  // ── Legend footer ────────────────────────────────────────────────────────
  const legendY = (doc as any).lastAutoTable.finalY + 18;
  const addLegendDot = (x: number, y: number, r: number, g: number, b: number, label: string) => {
    doc.setFillColor(r, g, b);
    doc.circle(x, y, 4, "F");
    doc.setTextColor(160, 175, 200);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, x + 8, y + 3);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 180);
  doc.text("Colour legend:", 40, legendY);
  addLegendDot(115, legendY - 2, 18, 239, 200, "Matched / Good (≥80% confidence)");
  addLegendDot(310, legendY - 2, 242, 180, 85, "Pending / Medium risk (50–79%)");
  addLegendDot(500, legendY - 2, 255, 82, 82, "Mismatch / High risk (<50%)");

  // ── Page numbers ─────────────────────────────────────────────────────────
  const totalPages: number = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(80, 100, 130);
    doc.text(
      `Page ${i} of ${totalPages}  •  GST Reconciliation Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 12,
      { align: "center" }
    );
  }

  doc.save(`GST_Alert_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────

const Row2 = () => {
  const { palette } = useTheme();
  const { data: summary } = useGetGSTSummaryQuery();
  const { data: alertsData } = useGetAlertsQuery();
  const { data: invoices } = useGetInvoicesQuery();

  const [exporting, setExporting] = useState(false);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Matched", value: summary.matchedInvoices },
      { name: "Mismatch", value: summary.mismatchedInvoices },
      { name: "Pending", value: summary.pendingInvoices },
    ];
  }, [summary]);

  const pieColors = [palette.primary[500], "#ff5252", "#8884d8"];

  const openAlerts = useMemo(
    () => alertsData?.filter((a) => a.status === "open").slice(0, 5) ?? [],
    [alertsData]
  );

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportAlertsPDF(openAlerts, invoices ?? [], summary);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Box D — GST KPI cards */}
      <DashboardBox gridArea="d">
        <BoxHeader
          title="GST Summary"
          subtitle={summary?.period ?? "Current Period"}
          sideText={`Health: ${summary?.healthScore ?? 0}/100`}
        />
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap="0.75rem" p="0.5rem 1rem 1rem 1rem">
          {[
            { label: "Total Invoices", value: summary?.totalInvoices ?? 0, color: palette.grey[200] },
            { label: "Matched", value: summary?.matchedInvoices ?? 0, color: palette.primary[400] },
            { label: "Mismatched", value: summary?.mismatchedInvoices ?? 0, color: "#ff5252" },
            { label: "Pending", value: summary?.pendingInvoices ?? 0, color: "#8884d8" },
          ].map((kpi) => (
            <Box
              key={kpi.label}
              sx={{
                background: palette.background.default,
                borderRadius: "8px",
                padding: "10px 14px",
                border: `1px solid ${palette.grey[900]}`,
              }}
            >
              <Typography sx={{ fontSize: "10px", color: palette.grey[600], mb: "4px", fontWeight: 500 }}>
                {kpi.label}
              </Typography>
              <Typography sx={{ fontSize: "22px", fontWeight: 700, color: kpi.color, fontFamily: "IBM Plex Mono, monospace" }}>
                {kpi.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DashboardBox>

      {/* Box E — Invoice status mix */}
      <DashboardBox gridArea="e" sx={{ overflow: "hidden" }}>
        <BoxHeader
          title="Invoice Status Mix"
          subtitle="current period breakdown"
          sideText=""
        />

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          p="0.5rem 1rem 1rem 1rem"
        >
          <Box width="100%" height="110px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  stroke="none"
                  data={pieData}
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: palette.background.light,
                    border: "none",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Box width="100%" mt="0.5rem">
            {pieData.map((item, i) => (
              <FlexBetween key={item.name} mb="0.25rem">
                <FlexBetween gap="0.4rem">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "2px",
                      background: pieColors[i],
                    }}
                  />
                  <Typography fontSize="11px">{item.name}</Typography>
                </FlexBetween>
                <Typography fontSize="11px" color={pieColors[i]} fontWeight={600}>
                  {item.value}
                </Typography>
              </FlexBetween>
            ))}

            <Box
              mt="0.5rem"
              pt="0.4rem"
              sx={{ borderTop: `1px solid ${palette.grey[800]}` }}
            >
              <Typography fontSize="10px">
                ITC Claimable:{" "}
                <span style={{ color: palette.primary[400], fontWeight: 600 }}>
                  ₹{((summary?.totalITC ?? 0) / 100000).toFixed(1)}L
                </span>
              </Typography>

              <Typography fontSize="10px" mt="0.2rem">
                ITC at Risk:{" "}
                <span style={{ color: "#ff5252", fontWeight: 600 }}>
                  ₹{((summary?.itcAtRisk ?? 0) / 100000).toFixed(1)}L
                </span>
              </Typography>
            </Box>
          </Box>
        </Box>
      </DashboardBox>

      {/* Box F — Alerts panel */}
      <DashboardBox gridArea="f">
        {/* Header row with Export PDF button */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          pr="1rem"
          pt="0.25rem"
        >
          <BoxHeader
            title="Active Alerts"
            subtitle="requires your attention"
            sideText={`${openAlerts.length} open`}
          />

          <Button
            size="small"
            variant="outlined"
            disabled={exporting || openAlerts.length === 0}
            onClick={handleExportPDF}
            startIcon={
              exporting ? (
                <CircularProgress size={11} color="inherit" />
              ) : (
                <PictureAsPdfIcon sx={{ fontSize: "13px" }} />
              )
            }
            sx={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "20px",
              px: "12px",
              py: "4px",
              whiteSpace: "nowrap",
              borderColor: "rgba(255,82,82,0.4)",
              color: "#ff7070",
              letterSpacing: "0.3px",
              "&:hover": {
                borderColor: "#ff5252",
                background: "rgba(255,82,82,0.08)",
              },
              "&:disabled": {
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.25)",
              },
            }}
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </Box>

        <Box p="0.25rem 1rem" sx={{ overflow: "auto", maxHeight: "220px" }}>
          {openAlerts.map((alert) => (
            <Box
              key={alert._id}
              display="flex"
              gap="0.6rem"
              mb="0.6rem"
              p="8px 10px"
              sx={{
                background: palette.background.default,
                borderRadius: "8px",
                borderLeft: `3px solid ${
                  alert.severity === "High"
                    ? "#ff5252"
                    : alert.severity === "Medium"
                    ? "#f2b455"
                    : "#8884d8"
                }`,
              }}
            >
              <AlertIcon severity={alert.severity} />
              <Box flex={1}>
                <Typography sx={{ fontSize: "11px", color: palette.grey[300], lineHeight: 1.4 }}>
                  {alert.message}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: palette.grey[700], mt: "2px" }}>
                  {alert.date}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DashboardBox>
    </>
  );
};

export default Row2;