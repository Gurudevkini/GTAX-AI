import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useRegisterMutation } from "@/state/api";

const Register = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [registerMutation, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gstin: "",
    password: "",
  });
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in required fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      const result = await registerMutation(form).unwrap();
      localStorage.setItem("gtax_token", result.token);
      localStorage.setItem("gtax_user", JSON.stringify(result.user));
      // Force full reload so App re-checks auth state
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.data?.message ?? "Registration failed. Please try again.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: palette.background.default,
    border: `1px solid ${palette.grey[800]}`,
    borderRadius: "8px",
    color: palette.grey[300],
    fontSize: "13px",
    fontFamily: "IBM Plex Sans, Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const Label = ({ text }: { text: string }) => (
    <Typography
      fontSize="11px"
      color={palette.grey[600]}
      fontWeight={500}
      sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: "6px" }}
    >
      {text}
    </Typography>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: palette.background.default,
        p: "1rem",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "420px",
          background: palette.background.light,
          border: `1px solid ${palette.grey[900]}`,
          borderRadius: "14px",
          padding: "2rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Brand */}
        <Box display="flex" alignItems="center" gap="10px" mb="1.75rem">
          <Box
            sx={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${palette.primary[500]}, ${palette.primary[700]})`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: "18px", color: "#1a1d23" }} />
          </Box>
          <Box>
            <Typography fontSize="16px" fontWeight={700} color={palette.grey[200]} letterSpacing="-0.3px">
              GTax AI
            </Typography>
            <Typography fontSize="10px" color={palette.grey[700]}>
              AI Co-Pilot for Smarter GST Compliance
            </Typography>
          </Box>
        </Box>

        <Typography fontSize="20px" fontWeight={700} color={palette.grey[200]} mb="4px">
          Create account
        </Typography>
        <Typography fontSize="12px" color={palette.grey[700]} mb="1.5rem">
          Start your GST compliance journey
        </Typography>

        {error && (
          <Typography
            fontSize="12px"
            color="#ff5252"
            mb="1rem"
            sx={{
              background: "rgba(255,82,82,0.08)",
              p: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,82,82,0.2)",
            }}
          >
            {error}
          </Typography>
        )}

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap="12px" mb="1rem">
          <Box>
            <Label text="First Name *" />
            <input type="text" placeholder="Ravi" value={form.firstName} onChange={set("firstName")} style={inputStyle} />
          </Box>
          <Box>
            <Label text="Last Name" />
            <input type="text" placeholder="Kumar" value={form.lastName} onChange={set("lastName")} style={inputStyle} />
          </Box>
        </Box>

        <Box mb="1rem">
          <Label text="Email Address *" />
          <input type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} style={inputStyle} />
        </Box>

        <Box mb="1rem">
          <Label text="GSTIN (optional)" />
          <input
            type="text"
            placeholder="22AAAAA0000A1Z5"
            value={form.gstin}
            onChange={set("gstin")}
            style={{ ...inputStyle, fontFamily: "IBM Plex Mono, monospace", fontSize: "12px" }}
            maxLength={15}
          />
        </Box>

        <Box mb="1.5rem">
          <Label text="Password *" />
          <input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} style={inputStyle} />
        </Box>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "11px",
            background: isLoading ? "#0b8f78" : palette.primary[500],
            color: "#0a1628",
            fontSize: "13px",
            fontWeight: 700,
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "IBM Plex Sans, Inter, sans-serif",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </button>

        <Typography fontSize="10px" color={palette.grey[800]} textAlign="center" mt="1rem" lineHeight={1.5}>
          By creating an account you agree to our{" "}
          <span style={{ color: palette.primary[400], cursor: "pointer" }}>Terms of Service</span> and{" "}
          <span style={{ color: palette.primary[400], cursor: "pointer" }}>Privacy Policy</span>
        </Typography>

        <Typography fontSize="12px" color={palette.grey[700]} textAlign="center" mt="1rem">
          Already have an account?{" "}
          <Link to="/login" style={{ color: palette.primary[400], fontWeight: 600, textDecoration: "none" }}>
            Sign in →
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;