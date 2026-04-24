import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import UpgradeModal from "./UpgradeModal";
import { useUpdateUserMutation } from "@/state/api";

export type PlanType = "free" | "business" | "ca";

interface PremiumLockProps {
  children: React.ReactNode;
  requiredPlan: "business" | "ca";
  badge?: string;
  label?: string;
  currentPlan: PlanType;
  onUpgraded?: (newPlan: string) => void;
}

const PLAN_ORDER: Record<PlanType, number> = { free: 0, business: 1, ca: 2 };

const PremiumLock: React.FC<PremiumLockProps> = ({
  children,
  requiredPlan,
  badge,
  label,
  currentPlan,
  onUpgraded,
}) => {
  const [open, setOpen] = useState(false);
  const [updateUser] = useUpdateUserMutation();

  const isLocked = PLAN_ORDER[currentPlan] < PLAN_ORDER[requiredPlan];

  const handleUpgrade = async (plan: string) => {
    try {
      // Try the API — but always succeed locally regardless
      await updateUser({ planType: plan }).unwrap().catch(() => null);
    } catch (_) {
      // ignore API errors in demo mode
    }
    // Always update localStorage + parent state
    const stored = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    stored.planType = plan;
    localStorage.setItem("gtax_user", JSON.stringify(stored));
    setOpen(false);
    if (onUpgraded) onUpgraded(plan);
  };

  if (!isLocked) return <>{children}</>;

  const badgeLabel = badge ?? (requiredPlan === "ca" ? "CA Plan" : "Business Plan");

  return (
    <>
      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        onUpgrade={handleUpgrade}
        currentPlan={currentPlan}
      />
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Blurred content underneath */}
        <Box
          sx={{
            filter: "blur(4px) grayscale(60%)",
            opacity: 0.4,
            pointerEvents: "none",
            height: "100%",
            userSelect: "none",
          }}
        >
          {children}
        </Box>

        {/* Lock overlay */}
        <Box
          onClick={() => setOpen(true)}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            background:
              "radial-gradient(ellipse at center, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.82) 40%, transparent 100%)",
            borderRadius: "16px",
            transition: "all 0.2s",
            "&:hover .lock-icon-box": {
              transform: "scale(1.12)",
              boxShadow: "0 0 28px rgba(18,239,200,0.55)",
            },
            "&:hover .lock-label": {
              opacity: 1,
            },
          }}
        >
          {/* Badge pill */}
          <Box
            sx={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "linear-gradient(135deg, #12efe8, #6870fa)",
              color: "#000",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              px: "10px",
              py: "4px",
              borderRadius: "20px",
            }}
          >
            {badgeLabel}
          </Box>

          {/* Lock icon */}
          <Box
            className="lock-icon-box"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(18,239,200,0.15), rgba(104,112,250,0.15))",
              border: "1.5px solid rgba(18,239,200,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s ease",
              boxShadow: "0 0 14px rgba(18,239,200,0.2)",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: "22px", color: "#12efe8" }} />
          </Box>

          <Typography
            className="lock-label"
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "12px",
              fontWeight: 600,
              opacity: 0.85,
              transition: "opacity 0.2s",
              textAlign: "center",
            }}
          >
            {label ?? "Unlock with " + badgeLabel}
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "10px",
              fontWeight: 400,
              textAlign: "center",
            }}
          >
            Click to upgrade
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default PremiumLock;
