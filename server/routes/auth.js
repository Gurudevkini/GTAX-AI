import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// In-memory user store (swap for MongoDB later)
const users = [];

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, gstin, password } = req.body;

    if (!firstName || !email || !password)
      return res.status(400).json({ success: false, message: "firstName, email and password are required." });

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      _id: `user_${Date.now()}`,
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      gstin: gstin || "",
      planType: "free",
      profileImage: "",
      usageCount: 0,
      password: hashed,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "gtax_secret_dev",
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /auth/update
router.post("/update", (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    // If no token, still allow in demo mode — just return updated fields
    let baseUser = {
      _id: "demo_user",
      firstName: "Demo",
      lastName: "User",
      email: "demo@gtax.ai",
      gstin: "",
      planType: "free",
      profileImage: "",
      usageCount: 0,
      hasCompletedOnboarding: false,
    };

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "gtax_secret_dev");
        // Try to find in memory store first
        const found = users.find((u) => u._id === decoded.userId);
        if (found) {
          baseUser = { ...found };
        } else {
          // Reconstruct from JWT payload (demo/mock mode)
          baseUser._id = decoded.userId || baseUser._id;
          baseUser.email = decoded.email || baseUser.email;
        }
      } catch (_) {
        // Invalid token — still proceed in demo mode
      }
    }

    // Apply updates
    const updated = {
      ...baseUser,
      planType: req.body.planType ?? baseUser.planType,
      profileImage: req.body.profileImage !== undefined ? req.body.profileImage : baseUser.profileImage,
      usageCount: req.body.usageCount !== undefined ? req.body.usageCount : baseUser.usageCount,
      hasCompletedOnboarding: req.body.hasCompletedOnboarding !== undefined ? req.body.hasCompletedOnboarding : baseUser.hasCompletedOnboarding,
    };

    // Persist in memory if user exists
    const idx = users.findIndex((u) => u._id === updated._id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
    }

    const { password: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update user: " + err.message });
  }
});


// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = users.find((u) => u.email === email.toLowerCase());
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "gtax_secret_dev",
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user;
    res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /auth/me
router.get("/me", (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "gtax_secret_dev");
    const user = users.find((u) => u._id === decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});

export default router;