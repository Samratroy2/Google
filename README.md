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
├── backend
│   ├── controllers
│   │   └── chatController.js
│   ├── routes
│   │   ├── api.js
│   │   └── chat.js
│   ├── services
│   │   └── aiService.js
│   ├── utils
│   │   └── email.js
│   └── .env
├── public/
│   └── index.html
└── src/
    ├── App.js                    # Main router
    ├── index.js                  # Entry point
    ├── context/
    │   └── AppContext.js         # Global state (needs, volunteers, notifications)
    ├── data/
    │   └── mockData.js           # Mock data + constants
    ├── hooks/
    │   └── useFilters.js         # Reusable filter hook
    ├── utils/
    │   ├── aiEngine.js           # AI matching, NLP, urgency detection
    │   └── helpers.js            # Utility functions
    ├── styles/
    │   └── global.css            # CSS variables + global styles
    ├── components/
    │   ├── Layout/
    │   │   ├── Layout.js         # Shell layout
    │   │   ├── Topbar.js         # Top navigation bar
    │   │   └── Sidebar.js        # Side navigation
    │   ├── UI/
    │   │   ├── Badge.js          # Status/urgency badges
    │   │   ├── Button.js         # Reusable button
    │   │   ├── Input.js          # Form input
    │   │   ├── Select.js         # Form select
    │   │   ├── Modal.js          # Modal dialog
    │   │   └── StatCard.js       # Dashboard stat card
    │   ├── Needs/
    │   │   ├── NeedCard.js       # Need item card
    │   │   ├── NLPClassifier.js  # AI text classifier UI
    │   │   └── MatchModal.js     # AI match results modal
    │   └── Volunteers/
    │       └── VolunteerCard.js  # Volunteer profile card
    ├──pages/
        ├── Dashboard.js          # Overview + charts
        ├── Dashboard.module.css
        ├── NeedsPage.js          # Browse & manage needs
        ├── NeedsPage.module.css
        ├── PostNeedPage.js       # Post new need form
        ├── PostNeedPage.module.css
        ├── VolunteersPage.js     # Volunteer directory
        ├── VolunteersPage.module.css
        ├── MapPage.js            # Live map view
        ├── MapPage.module.css
        ├── ChatbotPage.js        # AI chatbot assistant
        ├── ChatbotPage.module.css
        ├── AdminPage.js          # Admin control panel
        └── AdminPage.module.css
    └── firebase.js
  └──.env


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
