# 🚀 GTax AI — AI-Powered GST Co-Pilot for MSMEs

[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/UI-Material--UI-007FFF?style=flat-square&logo=mui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

**GTax AI** is a professional GST compliance dashboard engineered specifically for Micro, Small, and Medium Enterprises (MSMEs). It transforms complex tax data into actionable insights, helping businesses transition from **reactive filing** to **proactive compliance**.

---

## 📽️ Project Preview

![GTax AI Dashboard Placeholder](https://via.placeholder.com/1200x600?text=GTax+AI+Dashboard+Preview)
*The interactive dashboard providing real-time GST health scores and invoice insights.*

---

## 🧠 The Problem
Small businesses frequently encounter critical bottlenecks in GST management:
- ❌ **Filing Errors:** Manual entry leads to costly mistakes.
- ❌ **ITC Rejections:** Mismatched invoices cause loss of Input Tax Credit.
- ❌ **Vendor Risks:** Non-compliant suppliers jeopardize the business's tax status.
- ❌ **Complexity:** Constant regulatory changes are hard to track manually.

**GTax AI** serves as a **GST Co-Pilot**, automating reconciliation and flagging risks before they impact your bottom line.

---

## 🛠️ Key Features

### 🔍 Invoice Reconciliation
- **Automated Matching:** Instantly compares purchase data with GSTR-2B.
- **Smart Categorization:** Highlights "Matched", "Missing in GSTR", and "Amount Mismatch" records.

### 📉 ITC Risk Analysis
- **Credit Optimization:** Calculates eligible ITC and flags potential losses.
- **Risk Detection:** Identifies invoices at risk due to vendor non-compliance.

### 🏢 Vendor Risk Monitoring
- **Compliance Scoring:** Rates suppliers based on their filing history.
- **Proactive Alerts:** Flags risky suppliers to prevent future ITC issues.

### 📊 Executive Dashboard
- **Health Score:** A single metric to track overall GST compliance status.
- **Visual Analytics:** Real-time charts for GST payable vs. ITC claimed.

### 🤖 AI-Powered Insights
- **Predictive Trends:** Forecasts future tax liabilities based on historical data.
- **Smart Suggestions:** Recommends actions to resolve mismatches efficiently.

---

## 💻 Tech Stack

### Frontend
- **Framework:** React.js 18 (TypeScript)
- **Styling:** Material UI (MUI) & Emotion
- **State Management:** Redux Toolkit
- **Charts:** Recharts
- **Data Grid:** MUI X-DataGrid

### Backend
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB (via Mongoose)
- **Security:** Helmet, CORS, Bcrypt.js, JWT
- **File Handling:** Multer & XLSX (Excel processing)

---

## 📂 Project Structure

```bash
GTAX-AI/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application screens
│   │   ├── state/          # Redux slices and API setup
│   │   ├── scenes/         # Dashboard modules
│   │   └── App.tsx         # Main entry point
│   └── package.json
│
├── server/                 # Backend Node.js API
│   ├── data/               # Mock data & seeds
│   ├── routes/             # API Endpoints
│   ├── models/             # Database Schemas
│   ├── utils/              # Helper functions
│   └── index.js            # Server entry point
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.x or higher)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gurudevkini/GTAX-AI.git
   cd GTAX-AI
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   ```
   - Create a `.env` file in the `server` directory and add:
     ```env
     PORT=5001
     MONGO_URL=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     ```
   - Start the server:
     ```bash
     npm run dev
     ```

3. **Setup Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   - Access the dashboard at `http://localhost:5173`

---

## 🛠️ Roadmap & Future Enhancements
- [ ] **Tally/ERP Integration:** Direct sync with accounting software.
- [ ] **Multi-GSTIN Support:** Manage multiple business units in one account.
- [ ] **Mobile App:** Real-time alerts and dashboard access on the go.
- [ ] **Advanced AI Chatbot:** Natural language queries for GST laws.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the **ISC License**. See `LICENSE` for more information.

## ✉️ Contact
**Project Maintainer:** [Gurudev Kini](https://github.com/Gurudevkini)  
**Project Link:** [https://github.com/Gurudevkini/GTAX-AI](https://github.com/Gurudevkini/GTAX-AI)

---
*Built with ❤️ for the MSME Community.*