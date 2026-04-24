import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button, TextField, CircularProgress } from "@mui/material";
import { useUpdateUserMutation } from "@/state/api";

const personas = [
  { id: "business", label: "Business Owner", desc: "Manage your company's own GST compliance." },
  { id: "ca", label: "Chartered Accountant (CA)", desc: "Manage GST for multiple clients and vendors." },
  { id: "enterprise", label: "Enterprise Tax Team", desc: "Automate large-scale AP/AR reconciliation." }
];

const goals = [
  { id: "mismatches", label: "Identify ITC Mismatches", icon: "🔍" },
  { id: "vendors", label: "Audit Vendor Compliance", icon: "🏢" },
  { id: "reports", label: "Generate GSTR-2B Reports", icon: "📄" },
  { id: "health", label: "Improve GST Health Score", icon: "📈" }
];

const Onboarding = () => {
  const { palette } = useTheme();
  const [step, setStep] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [updateUser] = useUpdateUserMutation();

  const [formData, setFormData] = useState({
    persona: "",
    companyName: "",
    turnover: "",
    goal: ""
  });

  const handleSkipOrComplete = async () => {
    try {
      await updateUser({ hasCompletedOnboarding: true }).unwrap().catch(() => null);
    } catch (_) {}

    const stored = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    stored.hasCompletedOnboarding = true;
    localStorage.setItem("gtax_user", JSON.stringify(stored));
    window.location.href = "/";
  };

  const nextStep = () => {
    if (step === 2) {
      setStep(3);
    } else {
      setStep(step + 1);
    }
  };

  // Step 3 animation logic
  useEffect(() => {
    if (step === 3) {
      const messages = [
        "Initializing AI algorithms...",
        "Setting up GSTIN reconciliation engines...",
        "Applying predictive compliance models...",
        "Workspace ready!"
      ];
      let i = 0;
      setLoadingMsg(messages[0]);
      
      const interval = setInterval(() => {
        i++;
        if (i < messages.length) {
          setLoadingMsg(messages[i]);
        }
        if (i === messages.length) {
          clearInterval(interval);
          setTimeout(() => {
            handleSkipOrComplete();
          }, 800);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <Box
      sx={{
        width: "100%", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(ellipse at center, rgba(31,42,64,1) 0%, rgba(10,22,40,1) 100%)`
      }}
    >
      <Box
        sx={{
          width: "100%", maxWidth: "600px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "16px",
          p: "3rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          position: "relative"
        }}
      >
        {/* Skip Button */}
        {step < 3 && (
          <Button 
            onClick={handleSkipOrComplete}
            sx={{ position: "absolute", top: "20px", right: "20px", color: palette.grey[500], textTransform: "none" }}
          >
            Skip for now
          </Button>
        )}

        {/* STEP 0: Welcome & Persona */}
        {step === 0 && (
          <Box display="flex" flexDirection="column" gap="2rem">
            <Box>
              <Typography variant="h2" mb="0.5rem" color="white" fontWeight={700}>Welcome to GTax AI ✨</Typography>
              <Typography color={palette.grey[400]}>Let's personalize your workspace. How are you planning to use GTax?</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap="1rem">
              {personas.map(p => (
                <Box
                  key={p.id}
                  onClick={() => setFormData({ ...formData, persona: p.id })}
                  sx={{
                    p: "1rem", borderRadius: "8px", cursor: "pointer",
                    border: formData.persona === p.id ? `2px solid ${palette.primary[500]}` : `1px solid ${palette.grey[700]}`,
                    background: formData.persona === p.id ? "rgba(18,239,200,0.05)" : "transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <Typography variant="h5" color="white" fontWeight={600}>{p.label}</Typography>
                  <Typography variant="body2" color={palette.grey[500]} mt="0.2rem">{p.desc}</Typography>
                </Box>
              ))}
            </Box>

            <Button 
              disabled={!formData.persona} 
              onClick={nextStep} 
              variant="contained" 
              sx={{ bgcolor: palette.primary[500], color: "#000", py: 1.5, fontWeight: 700, mt: "1rem" }}
            >
              Continue
            </Button>
          </Box>
        )}

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <Box display="flex" flexDirection="column" gap="2rem">
            <Box>
              <Typography variant="h2" mb="0.5rem" color="white" fontWeight={700}>Business Details 🏢</Typography>
              <Typography color={palette.grey[400]}>For better report generation, tell us about your entity.</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap="1.5rem">
              <TextField
                fullWidth label="Company Name" variant="outlined"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                InputProps={{ style: { color: "white" } }}
                InputLabelProps={{ style: { color: palette.grey[500] } }}
                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }}
              />

              <Box>
                <Typography color={palette.grey[400]} mb="0.5rem" fontSize="12px">Annual Turnover Category</Typography>
                <Box display="flex" gap="1rem">
                  {["< 5Cr", "5-50Cr", "> 50Cr"].map(cat => (
                    <Box
                      key={cat}
                      onClick={() => setFormData({ ...formData, turnover: cat })}
                      sx={{
                        flex: 1, p: "1rem", textAlign: "center", borderRadius: "8px", cursor: "pointer",
                        border: formData.turnover === cat ? `2px solid ${palette.primary[500]}` : `1px solid ${palette.grey[700]}`,
                        background: formData.turnover === cat ? "rgba(18,239,200,0.05)" : "transparent",
                      }}
                    >
                      <Typography color="white" fontWeight={600}>{cat}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box display="flex" gap="1rem" mt="1rem">
              <Button onClick={() => setStep(0)} variant="outlined" sx={{ flex: 1, color: palette.grey[300], borderColor: palette.grey[600] }}>Back</Button>
              <Button 
                disabled={!formData.companyName || !formData.turnover} 
                onClick={nextStep} 
                variant="contained" 
                sx={{ flex: 2, bgcolor: palette.primary[500], color: "#000", fontWeight: 700 }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2: Goal */}
        {step === 2 && (
          <Box display="flex" flexDirection="column" gap="2rem">
            <Box>
              <Typography variant="h2" mb="0.5rem" color="white" fontWeight={700}>What's your main goal? 🎯</Typography>
              <Typography color={palette.grey[400]}>We'll prioritize the features that matter most to you.</Typography>
            </Box>

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap="1rem">
              {goals.map(g => (
                <Box
                  key={g.id}
                  onClick={() => setFormData({ ...formData, goal: g.id })}
                  sx={{
                    p: "1.5rem 1rem", borderRadius: "8px", cursor: "pointer", textAlign: "center",
                    border: formData.goal === g.id ? `2px solid ${palette.primary[500]}` : `1px solid ${palette.grey[700]}`,
                    background: formData.goal === g.id ? "rgba(18,239,200,0.05)" : "transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <Typography fontSize="24px" mb="0.5rem">{g.icon}</Typography>
                  <Typography variant="h6" color="white" fontWeight={600}>{g.label}</Typography>
                </Box>
              ))}
            </Box>

            <Box display="flex" gap="1rem" mt="1rem">
              <Button onClick={() => setStep(1)} variant="outlined" sx={{ flex: 1, color: palette.grey[300], borderColor: palette.grey[600] }}>Back</Button>
              <Button 
                disabled={!formData.goal} 
                onClick={nextStep} 
                variant="contained" 
                sx={{ flex: 2, bgcolor: palette.primary[500], color: "#000", fontWeight: 700 }}
              >
                Finalize Setup
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 3: Loading Magic */}
        {step === 3 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="2rem" py="4rem" textAlign="center">
            <CircularProgress sx={{ color: palette.primary[500] }} size={60} thickness={4} />
            <Box>
              <Typography variant="h3" color="white" fontWeight={700} mb="0.5rem">Preparing your Dashboard</Typography>
              <Typography color={palette.primary[300]} sx={{ animation: "pulse 1.5s infinite" }}>
                {loadingMsg}
              </Typography>
            </Box>
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default Onboarding;
