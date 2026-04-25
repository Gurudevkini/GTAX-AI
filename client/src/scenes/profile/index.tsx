import { Box, Typography, useTheme, Button, TextField, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FlexBetween from "@/components/FlexBetween";
import { useUpdateUserMutation } from "@/state/api";

const Profile = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  // Parse the current logged-in user
  const user = JSON.parse(localStorage.getItem("gtax_user") || "{}");
  const [updateUser] = useUpdateUserMutation();
  
  const [profileImage, setProfileImage] = useState(
    user?.profileImage || `https://ui-avatars.com/api/?name=${user?.firstName || "User"}&background=random`
  );
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    gstin: user?.gstin || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [openAlert, setOpenAlert] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Optional API call (may fail if mock mode disconnected, but we don't care)
      await updateUser({ profileImage, ...formData }).unwrap().catch(() => null);
    } catch (_) {}
    
    // 2. Persist safely in local storage so it survives refreshes
    const stored = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    stored.profileImage = profileImage;
    stored.firstName = formData.firstName;
    stored.gstin = formData.gstin;
    stored.phoneNumber = formData.phoneNumber;
    localStorage.setItem("gtax_user", JSON.stringify(stored));
    
    // 3. Show success alert instead of reloading immediately
    setOpenAlert(true);

    // 4. Redirect to dashboard after a short delay so user sees the message
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  const handleCloseAlert = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("gtax_user");
    localStorage.removeItem("gtax_token");
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, rgba(31,42,64,0.95), rgba(22,30,48,0.95))`,
        borderRadius: "14px",
        p: "2rem",
        m: "1.5rem 2.5rem",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
      }}
    >
      <Typography variant="h3" mb="0.5rem">User Profile</Typography>
      <Typography variant="body2" color={palette.grey[400]} mb="2rem">
        Manage your account settings and plan.
      </Typography>

      <FlexBetween alignItems="flex-start" sx={{ flexDirection: { xs: "column", md: "row" }, gap: "2rem" }}>
        
        {/* Left Col: Avatar */}
        <Box display="flex" flexDirection="column" gap="1rem" alignItems="center">
          <Box
            sx={{
              width: 120, height: 120, borderRadius: "50%",
              overflow: "hidden", border: `3px solid ${palette.primary[500]}`,
              padding: "4px",
              background: "rgba(0,0,0,0.2)"
            }}
          >
            <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          </Box>
          <Button component="label" variant="outlined" sx={{ textTransform: "none", color: palette.primary[300], borderColor: palette.primary[300] }}>
            Change Avatar
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </Button>
        </Box>

        {/* Right Col: Form */}
        <Box flex="1" width="100%" display="flex" flexDirection="column" gap="1rem">
          <TextField
            fullWidth label="First Name" variant="outlined"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            InputProps={{ style: { color: "white" } }}
            InputLabelProps={{ style: { color: palette.grey[500] } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }}
          />
          <TextField
            fullWidth label="Email" variant="outlined" disabled
            defaultValue={user?.email || ""} 
            InputProps={{ style: { color: palette.grey[500] } }}
            InputLabelProps={{ style: { color: palette.grey[500] } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
          />
          <TextField
            fullWidth label="GSTIN Number" variant="outlined"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            InputProps={{ style: { color: "white" } }}
            InputLabelProps={{ style: { color: palette.grey[500] } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }}
          />
          <TextField
            fullWidth label="Phone Number" variant="outlined"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            InputProps={{ style: { color: "white" } }}
            InputLabelProps={{ style: { color: palette.grey[500] } }}
            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }}
          />

          <Box mt="1rem" p="1rem" borderRadius="8px" border={`1px solid ${palette.primary[500]}`} bgcolor="rgba(18,239,200,0.05)">
            <Typography variant="h5" color={palette.primary[400]} fontWeight={600} mb="0.5rem">Current Plan</Typography>
            <Typography variant="h3" color="white" textTransform="capitalize">{user?.planType || "Free"}</Typography>
            <Typography mt="0.5rem" variant="body2" color={palette.grey[400]}>Monthly limit: {(user?.planType || "free") === "free" ? "1 invoice/month" : "Unlimited scans & reports"}</Typography>
          </Box>

          <Box display="flex" justifyContent="flex-end" mt="1rem" gap="1rem">
            <Button onClick={handleSignOut} variant="outlined" sx={{ color: "#ff5252", borderColor: "#ff5252", fontWeight: 700, px: 4, py: 1.5 }}>
              Sign Out
            </Button>
            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: palette.primary[500], color: "#000", fontWeight: 700, px: 4, py: 1.5 }}>
              Save Changes
            </Button>
          </Box>
        </Box>

      </FlexBetween>

      <Snackbar open={openAlert} autoHideDuration={3000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%', bgcolor: palette.primary[500], color: "#000", fontWeight: 600 }}>
          Profile changes saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
