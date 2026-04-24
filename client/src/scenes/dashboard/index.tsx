import {
  Box,
  Button,
  Typography,
  useMediaQuery,
  CircularProgress,
  Collapse,
  Alert,
  AlertTitle,
  useTheme,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useState, useEffect, type ChangeEvent } from "react";
import Row1 from "./Row1";
import Row2 from "./Row2";
import Row3 from "./Row3";
import { useUploadFileMutation, useResetDataMutation, useGetInvoicesQuery, useUpdateUserMutation } from "@/state/api";
import UpgradeModal from "@/components/UpgradeModal";
import PremiumLock, { PlanType } from "@/components/PremiumLock";

const gridTemplateLargeScreens = `
  "a b c"
  "a b c"
  "a b c"
  "a b f"
  "d e f"
  "d e f"
  "d h i"
  "g h i"
  "g h j"
  "g h j"
`;

const gridTemplateSmallScreens = `
  "a" "a" "a" "a"
  "b" "b" "b" "b"
  "c" "c" "c"
  "d" "d" "d"
  "e" "e"
  "f" "f" "f"
  "g" "g" "g"
  "h" "h" "h" "h"
  "i" "i"
  "j" "j"
`;

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadState {
  status: UploadStatus;
  fileName: string;
  count: number;
  error: string;
}

const initState = (): UploadState => ({
  status: "idle",
  fileName: "",
  count: 0,
  error: "",
});

const Dashboard = () => {
  const { palette } = useTheme();
  const isAboveMediumScreens = useMediaQuery("(min-width: 900px)");
  const [uploadFile] = useUploadFileMutation();
  const [resetData, { isLoading: isResetting }] = useResetDataMutation();
  const [updateUser] = useUpdateUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(() => {
    const u = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    return (u.planType as PlanType) || "free";
  });
  const user = JSON.parse(localStorage.getItem("gtax_user") || "{}");

  const [invoiceState, setInvoiceState] = useState<UploadState>(initState());
  const [gstr2bState, setGstr2bState] = useState<UploadState>(initState());

  // Global banner: shown after any upload attempt
  const [banner, setBanner] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    body: string;
  }>({ show: false, type: "success", title: "", body: "" });

  // ── Sync upload state on page load/refresh ────────────────────────────────
  // If the server already has invoices in memory (e.g. after a browser refresh),
  // reflect that in the UI so the upload panel doesn't misleadingly show "idle".
  const { data: existingInvoices } = useGetInvoicesQuery();

  useEffect(() => {
    if (existingInvoices && existingInvoices.length > 0) {
      setInvoiceState({
        status: "success",
        fileName: "(previously loaded)",
        count: existingInvoices.length,
        error: "",
      });
    } else if (existingInvoices && existingInvoices.length === 0) {
      // Server has no data — ensure UI is also reset
      setInvoiceState(initState());
      setGstr2bState(initState());
    }
  }, [existingInvoices]);

  // ── Clear all data ────────────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await resetData().unwrap();
      setInvoiceState(initState());
      setGstr2bState(initState());
      setBanner({
        show: true,
        type: "success",
        title: "Data Cleared",
        body: "All invoices and GSTR-2B data have been wiped from the server. Upload new files to begin.",
      });
    } catch (err: any) {
      setBanner({
        show: true,
        type: "error",
        title: "Clear Failed",
        body: err?.data?.message ?? "Could not clear data. Please try again.",
      });
    }
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "invoices" | "gstr2b"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    // Validate — only CSV / Excel
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setBanner({
        show: true,
        type: "error",
        title: "Invalid File Type",
        body: `"${file.name}" is not a CSV or Excel file. Please upload a .csv, .xlsx, or .xls file.`,
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBanner({
        show: true,
        type: "error",
        title: "File Too Large",
        body: `"${file.name}" exceeds the 10 MB limit.`,
      });
      return;
    }

    // FEATURE GATING LOGIC — Free tier: 1 upload/month
    if (currentPlan === "free" && (user.usageCount || 0) >= 1) {
      setIsModalOpen(true);
      return;
    }

    const setter = type === "invoices" ? setInvoiceState : setGstr2bState;
    setter({ status: "uploading", fileName: file.name, count: 0, error: "" });
    setBanner({ show: false, type: "success", title: "", body: "" });

    try {
      const result = await uploadFile({ type, file }).unwrap();
      const count =
        (result as any)?.rowCount ??
        (result as any)?.data?.length ??
        0;

      setter({ status: "success", fileName: file.name, count, error: "" });

      setBanner({
        show: true,
        type: "success",
        title: "Files Uploaded Successfully",
        body:
          type === "invoices"
            ? `Invoices file "${file.name}" loaded — ${count} records ingested & reconciled.`
            : `GSTR-2B file "${file.name}" loaded — ${count} records processed. Invoices have been re-reconciled.`,
      });
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.error ?? "Upload failed. Please try again.";
      setter({ status: "error", fileName: file.name, count: 0, error: msg });
      setBanner({
        show: true,
        type: "error",
        title: "Uploading Files Failed",
        body: `Could not upload "${file.name}": ${msg}`,
      });
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      // Try API but don't block on failure (demo/mock mode)
      await updateUser({ planType: plan }).unwrap().catch(() => null);
    } catch (_) {
      // ignore
    }
    // Always update locally
    const stored = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    stored.planType = plan;
    localStorage.setItem("gtax_user", JSON.stringify(stored));
    setCurrentPlan(plan as PlanType);
    setIsModalOpen(false);
    setBanner({
      show: true, type: "success", title: "🎉 Plan Upgraded!",
      body: `You are now on the ${plan.toUpperCase()} plan. All features are now unlocked!`
    });
  };


  const renderUploadButton = (
    type: "invoices" | "gstr2b",
    state: UploadState,
    label: string,
    color: string,
    hoverColor: string,
    textColor: string
  ) => {
    const isUploading = state.status === "uploading";
    return (
      <Box flex={1}>
        <Typography variant="body2" mb="0.5rem" color="rgba(255,255,255,0.5)" fontSize="12px">
          {type === "invoices" ? "Invoices" : "GSTR-2B"} — CSV or Excel only
        </Typography>
        <Button
          variant="contained"
          component="label"
          fullWidth
          disabled={isUploading}
          startIcon={
            isUploading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <UploadFileIcon sx={{ fontSize: "18px" }} />
            )
          }
          sx={{
            backgroundColor: isUploading ? "rgba(255,255,255,0.1)" : color,
            color: isUploading ? "rgba(255,255,255,0.4)" : textColor,
            fontWeight: 600,
            fontSize: "13px",
            borderRadius: "8px",
            textTransform: "none",
            py: "10px",
            "&:hover": { backgroundColor: isUploading ? "rgba(255,255,255,0.1)" : hoverColor },
            "&:disabled": { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" },
          }}
        >
          {isUploading ? `Uploading ${state.fileName}…` : label}
          {/* CRITICAL: accept only CSV/Excel — hides PPT, PDF, images, etc. */}
          <input
            type="file"
            hidden
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={(e) => handleUpload(e, type)}
            disabled={isUploading}
          />
        </Button>

        {/* Per-button status line */}
        <Box mt="6px" minHeight="18px" display="flex" alignItems="center" gap="6px">
          {state.status === "success" && (
            <>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#12efe8", flexShrink: 0 }} />
              <Typography variant="caption" color="#12efe8" fontSize="11px">
                {state.fileName} &bull; {state.count} records
              </Typography>
            </>
          )}
          {state.status === "error" && (
            <>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#ff5252", flexShrink: 0 }} />
              <Typography variant="caption" color="#ff5252" fontSize="11px">
                {state.error}
              </Typography>
            </>
          )}
          {state.status === "idle" && (
            <Typography variant="caption" color="rgba(255,255,255,0.25)" fontSize="11px">
              No file selected
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <>
      <UpgradeModal 
        open={isModalOpen} onClose={() => setIsModalOpen(false)} 
        onUpgrade={handleUpgrade} currentPlan={user.planType || "free"} 
      />

      {/* ── Upload Panel ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          mx: "2.5rem",
          mt: "1.5rem",
          p: "1.5rem",
          background: "linear-gradient(135deg, rgba(31,42,64,0.95) 0%, rgba(22,30,48,0.95) 100%)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header row */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb="1.25rem">
          <Box>
            <Typography fontWeight={700} fontSize="15px" color="rgba(255,255,255,0.9)">
              Upload Data
            </Typography>
            <Typography fontSize="11px" color="rgba(255,255,255,0.35)" mt="2px">
              Upload your Invoices CSV and GSTR-2B CSV to reconcile and populate all charts
            </Typography>
          </Box>

          <Box display="flex" gap="0.75rem" alignItems="center">
            {/* Loaded counts pill */}
            {(["invoices", "gstr2b"] as const).map((t) => {
              const s = t === "invoices" ? invoiceState : gstr2bState;
              const loaded = s.status === "success";
              return (
                <Box
                  key={t}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    px: "14px",
                    py: "6px",
                    borderRadius: "20px",
                    border: `1px solid ${loaded ? (t === "invoices" ? "rgba(18,239,200,0.3)" : "rgba(104,112,250,0.3)") : "rgba(255,255,255,0.08)"}`,
                    background: loaded
                      ? t === "invoices"
                        ? "rgba(18,239,200,0.06)"
                        : "rgba(104,112,250,0.06)"
                      : "transparent",
                  }}
                >
                  <Typography
                    fontSize="11px"
                    fontWeight={600}
                    color={
                      loaded
                        ? t === "invoices"
                          ? "#12efe8"
                          : "#6870fa"
                        : "rgba(255,255,255,0.25)"
                    }
                  >
                    {t === "invoices" ? "📄" : "🧾"}{" "}
                    {t === "invoices" ? "Invoices" : "GSTR-2B"}:{" "}
                    {loaded ? s.count : "—"}
                  </Typography>
                </Box>
              );
            })}

            {/* Clear Data button — only shown when data exists */}
            {invoiceState.status === "success" && (
              <Button
                variant="outlined"
                size="small"
                disabled={isResetting}
                onClick={handleReset}
                startIcon={
                  isResetting
                    ? <CircularProgress size={12} color="inherit" />
                    : <DeleteOutlineIcon sx={{ fontSize: "14px" }} />
                }
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "20px",
                  px: "14px",
                  py: "6px",
                  borderColor: "rgba(255,82,82,0.35)",
                  color: "#ff5252",
                  "&:hover": {
                    borderColor: "#ff5252",
                    background: "rgba(255,82,82,0.08)",
                  },
                }}
              >
                {isResetting ? "Clearing…" : "Clear Data"}
              </Button>
            )}
          </Box>
        </Box>

        {/* Upload buttons */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap="1.5rem">
          {renderUploadButton(
            "invoices",
            invoiceState,
            "Upload Invoices",
            "#12efe8",
            "#0ecfc9",
            "#0a1628"
          )}
          {renderUploadButton(
            "gstr2b",
            gstr2bState,
            "Upload GSTR-2B",
            "#6870fa",
            "#535ad6",
            "#ffffff"
          )}
        </Box>

        {/* ── Alert Banner ──────────────────────────────────────────────── */}
        <Collapse in={banner.show}>
          <Alert
            severity={banner.type}
            onClose={() => setBanner((b) => ({ ...b, show: false }))}
            sx={{
              mt: "1.25rem",
              borderRadius: "10px",
              fontSize: "13px",
              background:
                banner.type === "success"
                  ? "rgba(18,239,200,0.08)"
                  : "rgba(255,82,82,0.08)",
              border:
                banner.type === "success"
                  ? "1px solid rgba(18,239,200,0.25)"
                  : "1px solid rgba(255,82,82,0.25)",
              color:
                banner.type === "success"
                  ? "#12efe8"
                  : "#ff7070",
              "& .MuiAlert-icon": {
                color: banner.type === "success" ? "#12efe8" : "#ff5252",
              },
              "& .MuiAlert-action .MuiButtonBase-root": {
                color: banner.type === "success" ? "#12efe8" : "#ff5252",
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 700, fontSize: "13px" }}>
              {banner.title}
            </AlertTitle>
            {banner.body}
          </Alert>
        </Collapse>
      </Box>

      {/* ── Conditional Dashboard Grid or Empty State ─────────────────────── */}
      {!(invoiceState.status === "success" && gstr2bState.status === "success") ? (
        <Box
          m="1.5rem 2.5rem"
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="4rem"
          sx={{
            background: "rgba(255,255,255,0.02)",
            border: `1px dashed ${palette.grey[800]}`,
            borderRadius: "16px",
            minHeight: "500px"
          }}
        >
          <Box
            sx={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(18,239,200,0.1), rgba(18,239,200,0.05))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: "1.5rem"
            }}
          >
            <UploadFileIcon sx={{ fontSize: "40px", color: palette.grey[500] }} />
          </Box>
          <Typography variant="h3" color="white" fontWeight={700} mb="0.5rem">
            No Reconciliation Data Available
          </Typography>
          <Typography color={palette.grey[400]} textAlign="center" maxWidth="400px">
            Please upload both your <b>Invoices</b> and <b>GSTR-2B</b> files using the panel above to unlock the dashboard and generate AI reconciliation insights.
          </Typography>
        </Box>
      ) : (
        <Box
          m="1.5rem 2.5rem"
          width="100%"
          height="100%"
          display="grid"
          gap="1.5rem"
          sx={
            isAboveMediumScreens
              ? {
                  gridTemplateColumns: "repeat(3, minmax(370px, 1fr))",
                  gridTemplateRows: "repeat(10, minmax(60px, 1fr))",
                  gridTemplateAreas: gridTemplateLargeScreens,
                }
              : {
                  gridAutoColumns: "1fr",
                  gridAutoRows: "80px",
                  gridTemplateAreas: gridTemplateSmallScreens,
                }
          }
        >
          <Row1 />
          <Row2 currentPlan={currentPlan} onUpgraded={(p) => setCurrentPlan(p as PlanType)} />
          <Row3 currentPlan={currentPlan} onUpgraded={(p) => setCurrentPlan(p as PlanType)} />
        </Box>
      )}
    </>
  );
};

export default Dashboard;