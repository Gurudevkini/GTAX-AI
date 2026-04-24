import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  useTheme,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOpenIcon from "@mui/icons-material/LockOpen";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
  currentPlan: string;
}

interface PlanConfig {
  key: string;
  title: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  locked: string[];
  isPro?: boolean;
  accentColor: string;
}

const PLANS: PlanConfig[] = [
  {
    key: "free",
    title: "Free",
    price: "₹0",
    period: "forever",
    tagline: "Get started with basic GST reconciliation.",
    accentColor: "rgba(255,255,255,0.2)",
    features: [
      "1 invoice upload per month",
      "Invoice Reconciliation chart",
      "ITC Risk Trend chart",
      "Basic GST Summary (count only)",
      "Active Alerts feed",
    ],
    locked: [
      "Invoice Status Pie chart",
      "PDF Export Reports",
      "Invoice Ledger table",
      "Vendor Risk Board",
      "ITC Summary & Health Score",
    ],
  },
  {
    key: "business",
    title: "Business",
    price: "₹799",
    period: "per year",
    tagline: "Unlock the full reconciliation experience.",
    isPro: false,
    accentColor: "#6870fa",
    features: [
      "Everything in Free",
      "Unlimited invoice uploads",
      "Invoice Status Pie chart",
      "PDF Export of Alerts + Invoices",
      "Invoice Ledger full table",
      "Vendor Risk Board",
      "ITC Summary panel",
    ],
    locked: [
      "GST Health Score",
      "Advanced AI ITC predictions",
      "Priority support",
    ],
  },
  {
    key: "ca",
    title: "CA",
    price: "₹1,499",
    period: "per year",
    tagline: "Everything unlimited — built for professional CAs.",
    isPro: true,
    accentColor: "#12efe8",
    features: [
      "Everything in Business",
      "Unlimited uploads & exports",
      "GST Health Score ring",
      "AI-powered ITC risk predictions",
      "Multi-client support",
      "Priority 24/7 support",
      "Export to Excel / PDF",
    ],
    locked: [],
  },
];

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onUpgrade,
  currentPlan,
}) => {
  const { palette } = useTheme();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const PLAN_ORDER: Record<string, number> = { free: 0, business: 1, ca: 2 };
  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;

  const handleClick = async (planKey: string) => {
    setUpgrading(planKey);
    await onUpgrade(planKey);
    setUpgrading(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, rgba(14,22,40,0.98) 0%, rgba(10,16,32,0.98) 100%)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          p: "0.5rem",
          overflow: "visible",
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          color: "rgba(255,255,255,0.4)",
          "&:hover": { color: "white" },
        }}
      >
        <CloseIcon sx={{ fontSize: "18px" }} />
      </IconButton>

      <DialogContent sx={{ pb: "2.5rem", pt: "1.5rem" }}>
        {/* Header */}
        <Box display="flex" flexDirection="column" alignItems="center" mb="2rem">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(18,239,200,0.2), rgba(104,112,250,0.2))",
              border: "1px solid rgba(18,239,200,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: "1rem",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: "22px", color: "#12efe8" }} />
          </Box>
          <Typography
            variant="h2"
            color="white"
            fontWeight={700}
            fontSize="22px"
            mb="6px"
          >
            Upgrade Your Plan
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.4)"
            fontSize="12px"
          >
            Unlock more features to turbocharge your GST compliance
          </Typography>
        </Box>

        {/* Plan Cards */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr" }}
          gap="1.25rem"
        >
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isDowngrade = PLAN_ORDER[plan.key] < currentOrder;
            const isUpgrade = PLAN_ORDER[plan.key] > currentOrder;

            return (
              <Box
                key={plan.key}
                sx={{
                  border: plan.isPro
                    ? `1.5px solid ${plan.accentColor}`
                    : isCurrent
                    ? "1.5px solid rgba(255,255,255,0.15)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  p: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  background: plan.isPro
                    ? "rgba(18,239,200,0.03)"
                    : "rgba(255,255,255,0.02)",
                  position: "relative",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: plan.accentColor,
                    background: `rgba(${plan.isPro ? "18,239,200" : "104,112,250"},0.04)`,
                  },
                }}
              >
                {/* Recommended badge */}
                {plan.isPro && (
                  <Chip
                    label="RECOMMENDED"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: "-12px",
                      right: "16px",
                      background: "linear-gradient(135deg, #12efe8, #6870fa)",
                      color: "#000",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.6px",
                      height: "22px",
                    }}
                  />
                )}
                {isCurrent && (
                  <Chip
                    label="CURRENT"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.6px",
                      height: "22px",
                    }}
                  />
                )}

                {/* Plan name */}
                <Typography color="white" fontWeight={700} fontSize="16px">
                  {plan.title}
                </Typography>

                {/* Price */}
                <Box display="flex" alignItems="end" gap="4px">
                  <Typography
                    fontSize="28px"
                    fontWeight={800}
                    color={plan.accentColor}
                    lineHeight={1}
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {plan.price}
                  </Typography>
                  <Typography
                    fontSize="11px"
                    color="rgba(255,255,255,0.35)"
                    mb="4px"
                  >
                    / {plan.period}
                  </Typography>
                </Box>

                <Typography
                  fontSize="11px"
                  color="rgba(255,255,255,0.4)"
                  lineHeight={1.5}
                >
                  {plan.tagline}
                </Typography>

                {/* CTA Button */}
                <Button
                  fullWidth
                  disabled={isCurrent || isDowngrade || upgrading !== null}
                  onClick={() => handleClick(plan.key)}
                  startIcon={isUpgrade ? <LockOpenIcon sx={{ fontSize: "14px" }} /> : undefined}
                  sx={{
                    mt: "0.5rem",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "10px",
                    py: "9px",
                    fontSize: "12px",
                    background: isCurrent
                      ? "rgba(255,255,255,0.05)"
                      : isDowngrade
                      ? "transparent"
                      : plan.isPro
                      ? `linear-gradient(135deg, #12efe8, #6870fa)`
                      : `rgba(104,112,250,0.15)`,
                    color: isCurrent
                      ? "rgba(255,255,255,0.25)"
                      : isDowngrade
                      ? "rgba(255,255,255,0.15)"
                      : plan.isPro
                      ? "#000"
                      : plan.accentColor,
                    border: !plan.isPro && isUpgrade
                      ? `1px solid ${plan.accentColor}40`
                      : "none",
                    "&:hover": {
                      background:
                        !isCurrent && !isDowngrade && plan.isPro
                          ? "linear-gradient(135deg, #0ecfc9, #535ad6)"
                          : !isCurrent && !isDowngrade
                          ? `rgba(104,112,250,0.25)`
                          : undefined,
                    },
                  }}
                >
                  {upgrading === plan.key
                    ? "Upgrading…"
                    : isCurrent
                    ? "Your current plan"
                    : isDowngrade
                    ? "Lower plan"
                    : `Upgrade to ${plan.title}`}
                </Button>

                {/* Features */}
                <Box display="flex" flexDirection="column" gap="8px" mt="0.5rem">
                  {plan.features.map((f, i) => (
                    <Box key={i} display="flex" gap="10px" alignItems="start">
                      <CheckCircleOutlineIcon
                        sx={{
                          fontSize: "14px",
                          color: plan.accentColor,
                          mt: "1px",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        fontSize="11px"
                        color="rgba(255,255,255,0.65)"
                        lineHeight={1.45}
                      >
                        {f}
                      </Typography>
                    </Box>
                  ))}

                  {/* Locked features faded */}
                  {plan.locked.map((f, i) => (
                    <Box key={`locked-${i}`} display="flex" gap="10px" alignItems="start">
                      <CheckCircleOutlineIcon
                        sx={{
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.12)",
                          mt: "1px",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        fontSize="11px"
                        color="rgba(255,255,255,0.2)"
                        lineHeight={1.45}
                        sx={{ textDecoration: "line-through" }}
                      >
                        {f}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Typography
          textAlign="center"
          fontSize="10px"
          color="rgba(255,255,255,0.2)"
          mt="2rem"
        >
          Upgrade is instant in this demo. All plans are billed annually. Cancel anytime.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
