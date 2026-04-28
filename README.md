# 🌐 SmartAid — AI-Powered Disaster Response Platform

SmartAid is a full-stack, AI-driven web application designed to help NGOs, volunteers, and communities coordinate disaster relief efficiently and in real time.

It transforms unstructured crisis requests into actionable insights, enabling faster response, smarter matching, and better resource allocation.

---

# 🚀 Key Highlights
🧠 AI-powered need classification & urgency detection
🎯 Intelligent volunteer matching (scored recommendations)
🗺️ Real-time map-based coordination
📊 Predictive analytics for demand forecasting
💬 Guided chatbot for seamless user interaction

---


## 📁 Folder Structure

```
smartaid/
├── backend/
│   ├── controllers/                # API logic (AI, chat, data)
│   │   ├── aiController.js          
│   │   ├── chatController.js
│   │   └── dataController.js
│   │
│   ├── services/                   # AI, parsing, geocoding, email
│   │   ├── aiService.js            # Gemini / LLM logic
│   │   ├── parserService.js        # 🔥 NEW: unstructured → structured needs
│   │   ├── geocodingService.js
│   │   └── emailService.js
│   │
│   ├── routes/                     # API endpoints
│   │   ├── ai.js                   # 🔥 NEW: /parse-need, /match-volunteers
│   │   ├── api.js
│   │   └── chat.js
│   │
│   ├── utils/
│   │   └── eamil.js                # helper utilities
│   │
│   ├── package-lock.json
│   ├── package.json
│   └── .env
│
├── public/                         # Static assets
│   └── index.html
│
├── src/
│   ├── context/                    # Global state (Context API)
│   │   └── AppContext.js           
│   │
│   ├── utils/                      # API + AI helpers
│   │   ├── aiEngine.js             
│   │   ├── apiClient.js            
│   │   ├── email.js
│   │   ├── geo.js
│   │   ├── geocodingHelper.js
│   │   └── helpers.js
│   │
│   ├── components/                 # UI + feature components
│   │   ├── Intelligence/
│   │   │   ├── AIInputBox.js       
│   │   │   └── ParsedPreview.js    
│   │   │
│   │   ├── Layout/
│   │   │   ├── Layout.js
│   │   │   ├── Sidebar.js
│   │   │   └── Topbar.js
│   │   │
│   │   ├── Needs/
│   │   │   ├── NeedCard.js
│   │   │   └── MatchModal.js
│   │   │
│   │   ├── Volunteers/
│   │   │   └──NeedCard.js
│   │   ├── UI/
│   │   │   ├── Badge.js
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Modal.js
│   │   │   ├── Select.js
│   │   │   └── StatCard.js
│   │   │
│   │   └── ProtectedRoute.js 
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useFilters.js
│   │   └── useGoogleMaps.js 
│   │
│   ├── pages/                      # UI pages
│   │   ├── Dashboard.js
│   │   ├── MapPage.js
│   │   ├── PostNeedPage.js        
│   │   ├── ChatbotPage.js
│   │   ├── AdminVerifyPage.js
│   │   ├── LoginPage.js
│   │   ├── NeedsPage.js
│   │   ├── ProfilePage.js
│   │   ├── RegisterPage.js
│   │   ├── VolunteersPage.js
│   │   └── AdminPage.js
│   │
│   ├── data/                       # Mock data
│   │   └── mockData.js
│   │
│   ├── firebase.js
│   ├── index.js
│   └── App.js
│
├── package-lock.json
├── package.json
├── .env
└── README.md

```

---

## ✨ Features

### 🧩 Core Functionality
📋 Need Posting
NGOs can post requirements (food, medical aid, shelter) with location & urgency.
🙋 Volunteer Registration
Volunteers register with skills, availability, and location.
🔄 Workflow Management
Track requests:
Pending → Assigned → Completed
🔔 Real-Time Notifications
Instant alerts for new needs and matches.

### 🤖 AI Capabilities
🧠 NLP-Based Classification
Converts plain text into:
Category (Food / Medical / Shelter)
Urgency level
🎯 Smart Matching Engine
Scores volunteers (0–100%) using:
Skill match
Distance
Urgency
Experience
🔮 Demand Prediction
Forecasts future needs using historical trends.
💬 AI Chatbot Assistant
Helps users:
Post needs
Find volunteers
Navigate the platform

### UI
🗺️ Live Map View
Visual markers for needs and volunteers.
📊 Dashboard
Real-time stats, charts, and activity feed.
⚙️ Admin Panel
Full control with analytics and verification tools.
🌙 Dark/Light Mode
Theme toggle for better UX.

---

## 🛠 Tech Stack

Frontend

React 18
React Router v6
CSS Modules
Recharts
React Toastify

Backend

Node.js + Express
AI Services (LLM / Gemini integration)

State Management

Context API (lightweight, no Redux)

---

## 🎯 Demo Flow (for judges)

1. Open Dashboard → View stats + predictions
2. Go to Needs → Click “+ Post Need”
3. Enter:
4. "Urgent food needed for 50 families in Sector 4"
5. Click Classify → AI auto-detects details
6. Submit → Need appears instantly
7. Click AI Match → View ranked volunteers
8. Click Assign Best Match
9. Open Map → See real-time updates
10. Try AI Chatbot
11. Explore Admin Panel

---

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "react-toastify": "^10.0.4",
  "recharts": "^2.12.2"
}
```

---

## Why SmartAid Stands Out
- 🌍 Real-world impact — disaster relief optimization
- 🤖 Meaningful AI integration — not just for show
- ⚡ Fast, intuitive UX — easy for non-technical users
- 🧱 Scalable architecture — production-ready structure
- 🎯 Clear demo story — judges understand instantly

---

### 🔮 Future Enhancements
- 📱 Mobile Application (React Native)
Extend SmartAid to mobile devices for on-ground volunteers and rapid field reporting.
- 🌐 Multi-Language Support
Enable accessibility across diverse regions with real-time translation and localization.
- 🛰️ Offline-First Capability
Ensure functionality in low-connectivity disaster zones with data sync when back online.
- 🧾 Blockchain-Based Transparency
Implement secure and tamper-proof tracking of aid distribution for accountability.
- 📊 NGO Data Integration & Predictive Intelligence
Leverage real-time data from NGOs to power:
🔥 Dynamic heat maps of crisis zones
📍 Cluster analysis for resource concentration
⚠️ Risk prediction models for proactive response
--- 