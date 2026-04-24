# 🌐 SmartAid — Smart Resource Allocation System

A full-featured React web application for NGOs, volunteers, and communities to coordinate disaster relief and resource allocation in real time.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Open in browser
http://localhost:3000
```

---

## 📁 Folder Structure

```
smartaid/
├── backend/
│   ├── controllers/
│   │   ├── chatController.js      # Handles Gemini API for chatbot interaction 
│   │   └── dataController.js      # NEW: Aggregates historical surveys/field notes [cite: 12, 35]
│   ├── services/
│   │   ├── aiService.js           # Google AI / Vertex AI logic [cite: 37, 40]
│   │   └── geocodingService.js    # NEW: Converts addresses to lat/long for Heat Maps [cite: 39]
│   ├── routes/
│   │   ├── api.js
│   │   └── chat.js
│   └── .env                       # API Keys for Gemini and Google Maps [cite: 38, 39]
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── context/
│   │   └── AppContext.js          # Stores unified "Source of Truth" data 
│   ├── data/
│   │   └── mockData.js            # Unstructured historical data samples [cite: 6]
│   ├── hooks/
│   │   ├── useFilters.js
│   │   └── useHeatMap.js          # NEW: Custom hook for Google Maps layers [cite: 13]
│   ├── utils/
│   │   ├── aiEngine.js            # Smart Matching logic (Skill + Urgency + Location) [cite: 14, 34]
│   │   ├── dataParser.js          # NEW: Uses Gemini to structure siloed NGO data [cite: 12, 38]
│   │   └── helpers.js
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Topbar.js
│   │   │   └── Sidebar.js
│   │   ├── UI/
│   │   │   ├── Badge.js           # Urgency level indicators [cite: 33]
│   │   │   ├── StatCard.js
│   │   │   └── PriorityAlert.js   # NEW: Notifies users of "Immediate Attention" areas 
│   │   ├── Needs/
│   │   │   ├── NeedCard.js
│   │   │   ├── NLPClassifier.js   # UI for Gemini-powered data structuring 
│   │   │   └── MatchModal.js      # Displays Al-driven matching scores [cite: 14, 32]
│   │   ├── Intelligence/          # NEW: Dedicated folder for "Smart" features [cite: 30]
│   │   │   ├── HeatMapOverlay.js  # Google Maps visual intelligence 
│   │   │   └── SkillMatrix.js     # Visualization of volunteer skill-to-need gaps [cite: 34]
│   │   └── Volunteers/
│   │       └── VolunteerCard.js
│   ├── pages/
│   │   ├── Dashboard.js           # Unified view of aggregated data [cite: 35]
│   │   ├── MapPage.js             # Visualizing distribution & need hotspots [cite: 13]
│   │   ├── PostNeedPage.js        # Form for new needs with auto-priority detection [cite: 33]
│   │   ├── ChatbotPage.js         # Assistant for navigating scattered data [cite: 8]
│   │   └── AdminPage.js           # Resource allocation control center [cite: 17]
│   └── firebase.js
└── .env

```

---

## ✨ Features

### Core
| Feature | Description |
|---|---|
| 📋 Need Posting | NGOs post food/medical/shelter needs with location & urgency |
| 🙋 Volunteer Registration | Register with skill, location, availability |
| ✅ Status Tracking | Pending → Assigned → Completed workflow |
| 🔔 Notifications | Real-time alerts for new needs and matches |

### AI Features
| Feature | Description |
|---|---|
| 🤖 NLP Classifier | Type plain text → AI detects category + urgency |
| 🎯 Smart Matching | Scores volunteers 0–100% by skill, distance, urgency, experience |
| 🔮 Demand Prediction | Forecasts future needs by area using historical patterns |
| 💬 AI Chatbot | Guides users through posting needs and finding help |

### UI
| Feature | Description |
|---|---|
| 🗺️ Live Map | Interactive SVG map with need + volunteer markers |
| 📊 Dashboard | Charts, stats, activity feed |
| ⚙️ Admin Panel | Full table view, status control, analytics |
| 🌙 Dark/Light Theme | Toggle between themes |

---

## 🛠 Tech Stack

- **React 18** with React Router v6
- **CSS Modules** for scoped styling
- **Recharts** for data visualizations
- **React Toastify** for notifications
- **Context API** for global state (no Redux needed)

---

## 🎯 Demo Flow (for judges)

1. Open Dashboard → see live stats + AI demand predictions
2. Go to **Needs** → click **"+ Post Need"**
3. Type: *"Urgent food needed for 50 families in Sector 4"*
4. Click **Classify** → AI auto-detects category & urgency
5. Submit the form → need appears in list
6. Click **"AI Match"** → see ranked volunteer list with scores
7. Click **Assign Best Match** → status updates to Assigned
8. Go to **Map** → see markers update
9. Go to **AI Chat** → interact with chatbot
10. Go to **Admin** → see full analytics

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

## 🏆 Why This Wins

- ✅ High social impact — solves real problem
- ✅ AI features that actually work (NLP, matching, prediction)
- ✅ Clean, impressive visual demo flow
- ✅ Production-grade code structure
- ✅ Judges understand it instantly
