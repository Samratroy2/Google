import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ══════════════════════════════════════════════════════════════
// DOMAIN MAP  —  keyword → { type, matchSkills[] }
// ══════════════════════════════════════════════════════════════

const NEED_DOMAIN_MAP = {
  food:        { type: "Food",      matchSkills: ["food", "cooking", "nutrition", "catering", "chef"] },
  hungry:      { type: "Food",      matchSkills: ["food", "cooking", "nutrition", "catering", "chef"] },
  eat:         { type: "Food",      matchSkills: ["food", "cooking", "nutrition", "catering"] },
  meal:        { type: "Food",      matchSkills: ["food", "cooking", "nutrition", "catering"] },
  water:       { type: "Water",     matchSkills: ["water", "hydration", "plumbing", "sanitation"] },
  flood:       { type: "Water",     matchSkills: ["water", "rescue", "sanitation"] },
  drinking:    { type: "Water",     matchSkills: ["water", "sanitation", "hydration"] },
  doctor:      { type: "Medical",   matchSkills: ["medical", "doctor", "nurse", "first aid", "surgery", "paramedic"] },
  medical:     { type: "Medical",   matchSkills: ["medical", "doctor", "nurse", "first aid", "surgery", "paramedic"] },
  medicine:    { type: "Medical",   matchSkills: ["medical", "pharmacy", "health", "nurse"] },
  injured:     { type: "Medical",   matchSkills: ["medical", "first aid", "doctor", "surgery", "paramedic"] },
  hospital:    { type: "Medical",   matchSkills: ["medical", "doctor", "nurse"] },
  sick:        { type: "Medical",   matchSkills: ["medical", "nurse", "doctor", "first aid"] },
  surgery:     { type: "Medical",   matchSkills: ["surgery", "medical", "doctor"] },
  shelter:     { type: "Shelter",   matchSkills: ["shelter", "construction", "housing", "carpenter"] },
  house:       { type: "Shelter",   matchSkills: ["shelter", "construction", "housing"] },
  roof:        { type: "Shelter",   matchSkills: ["shelter", "construction", "carpenter"] },
  displaced:   { type: "Shelter",   matchSkills: ["shelter", "housing", "construction"] },
  clothing:    { type: "Clothing",  matchSkills: ["clothing", "tailoring", "distribution"] },
  clothes:     { type: "Clothing",  matchSkills: ["clothing", "tailoring", "distribution"] },
  transport:   { type: "Transport", matchSkills: ["transport", "driving", "logistics", "vehicle"] },
  vehicle:     { type: "Transport", matchSkills: ["transport", "driving", "logistics"] },
  ambulance:   { type: "Transport", matchSkills: ["transport", "medical", "driving"] },
  electricity: { type: "Utilities", matchSkills: ["electrical", "electrician", "utilities", "power"] },
  power:       { type: "Utilities", matchSkills: ["electrical", "electrician", "utilities"] },
  internet:    { type: "Utilities", matchSkills: ["it", "networking", "tech", "utilities"] },
};

const URGENCY_SIGNALS = {
  high: ["urgent", "asap", "immediately", "critical", "emergency", "right now", "dying", "bleeding", "help now", "serious"],
  low:  ["whenever", "not urgent", "low priority", "no rush", "whenever possible"],
};

// ══════════════════════════════════════════════════════════════
// PAGE GUIDE KNOWLEDGE BASE
// Built from actual screenshots of the SmartAid app
// ══════════════════════════════════════════════════════════════

const PAGE_GUIDES = {

  dashboard: `
📊 **Dashboard — Overview**

The Dashboard gives you a real-time overview of the entire platform.

**What you'll see:**
- 📋 **Total Needs** — all submitted needs
- ⏳ **Pending** — needs waiting for a volunteer
- 🔄 **Assigned** — needs with an active volunteer
- ✅ **Completed** — resolved needs
- 👥 **Active Volunteers** — currently available
- 📈 **Completion Rate** — % of resolved needs

**Charts:**
- **Needs by Category** — bar chart (Food, Water, Shelter, Medical)
- **Status Distribution** — pie chart (Pending / Assigned / Completed %)

**Recent Activity** — scroll down to see the latest events.

👉 Click **Dashboard** in the left sidebar to access this page.
`.trim(),

  needs: `
📋 **Needs — Active Needs Page**

This page shows all submitted help requests.

**Filters available:**
- **Status** → All / Pending / Assigned / Completed
- **Type** → Food / Medical / Shelter / Water / Other
- **Urgency** → Critical / High / Medium / Low
- **Search bar** → Search by title or location

**Each need card shows:**
- Title, type icon, location, time posted, quantity
- Urgency badge: Critical 🔴 / High / Medium 🟡 / Low 🟢
- Status badge: Pending / Assigned / Completed

**Action buttons on each card:**
- **✅ Complete** — mark the need as resolved
- **🤖 AI Match** — let AI find and assign the best volunteer
- **Assign** — manually pick a volunteer

👉 Click **Needs** in the left sidebar to access this page.
`.trim(),

  postNeed: `
➕ **How to Post a New Need**

**Step 1** → Click **Needs** in the left sidebar
**Step 2** → Click the **"+ Post Need"** button (top-right corner)
**Step 3** → Fill in the form:
  - **Title** — describe clearly (e.g. "Food for 20 families")
  - **Type** — Food / Water / Medical / Shelter / Other
  - **Urgency** — Critical / High / Medium / Low
  - **Location** — where help is needed
  - **Quantity** — how many units/packets needed
**Step 4** → Submit

Once posted, the system notifies available volunteers and AI matching begins automatically.
`.trim(),

  volunteers: `
👥 **Volunteers Page**

This page lists all approved, available volunteers.

**Each volunteer card shows:**
- Name, avatar, role (e.g. Doctor, Teacher)
- 📍 Location and distance from you
- ⭐ Rating and tasks completed
- Join date
- **Skill tags** (e.g. Surgery, First Aid)
- 🟢 **Available** status badge

**To search:** Use the search bar — search by email or location

**To assign a volunteer:**
👉 Go to **Needs** page → find a need → click **"Assign"** or **"🤖 AI Match"**

**Note:** Volunteers must have their availability set to "Available" in their profile to appear here.
`.trim(),

  aiMatch: `
🤖 **AI Match — How It Works**

AI Match automatically finds the best volunteer for a need.

**How to use it:**
1. Go to the **Needs** page
2. Find a pending need
3. Click **"🤖 AI Match"**
4. The system finds the best volunteer based on:
   - Skill relevance (e.g. Medical need → Doctor/Nurse/First Aid)
   - Location proximity
5. The volunteer is assigned automatically

**Manual option:** Click **"Assign"** instead to pick a volunteer yourself.

**Tip:** Volunteers with detailed skill profiles get matched more accurately. Remind volunteers to update their **Sub Skills** in My Profile.
`.trim(),

  liveMap: `
🗺️ **Live Map View**

The Live Map shows real-time locations of needs and volunteers on a map.

**Map controls:**
- Toggle **Map** / **Satellite** view (top-left of map)
- 🔴 Red pins = Active Needs
- 🟢 Green pins = Volunteers
- Click any pin to see details

**Filter buttons (top-right):**
- **Needs** button — show/hide need pins
- **Volunteers** button — show/hide volunteer pins

**Bottom bar** shows total Active Needs and Volunteer counts.

**Best use:** Coordinators can spot clusters of needs and find nearby volunteers at a glance.

👉 Click **Live Map** in the left sidebar to access this page.
`.trim(),

  profile: `
👤 **My Profile — Edit Profile**

Update your personal details and availability here.

**Editable fields:**
- **Username** — your display name shown to others
- **Email** — your registered email (✅ verified)
- **Hobby / Role** — your primary role (e.g. Teacher, Doctor)
- **Location** — your city/area (used for proximity matching)
- **Phone** — your contact number
- **Sub Skills** — specific skills (e.g. Surgery, First Aid, Cooking)
- **Bio** — describe your experience
- **Availability** — 🟢 Available or 🔴 Unavailable
- **Proof URL** — link to certification or credentials

**Why it matters:**
Your skills and availability are used by the AI matching system. A complete profile = better matches.

👉 Click **My Profile** in the left sidebar to access this page.
`.trim(),

  aiChat: `
💬 **AI Chat — What I Can Help With**

You're already here! Here's everything I can do:

**🆘 Report a need:**
*"I need food for 20 people"*, *"Need a doctor urgently"*, *"We need clean water"*
→ I'll guide you step by step AND show matched volunteers right away.

**👥 Find volunteers:**
*"Show available volunteers"*, *"Who can help?"*
→ I'll list all available volunteers with skills and location.

**📋 View needs:**
*"Show active needs"*, *"List all needs"*
→ I'll list all current needs with urgency and status.

**🤖 Assignment help:**
*"Assign a volunteer"*, *"How do I use AI Match?"*
→ I'll explain the process and guide you through it.

**📖 Page guides — just ask:**
- *"How do I use the Dashboard?"*
- *"How does the map work?"*
- *"How do I post a need?"*
- *"How do I edit my profile?"*
- *"I am an NGO, how do I start?"*

Use the **suggestion chips** below the chat for quick access!
`.trim(),

  sidebar: `
🧭 **Navigation — Left Sidebar**

Here's what each item does:

- 📊 **Dashboard** — Stats overview, charts, recent activity
- 📋 **Needs** *(badge = pending count)* — View, post, and manage needs
- 👥 **Volunteers** — Browse available volunteers
- 🗺️ **Live Map** — Real-time map of needs + volunteers
- 💬 **AI Chat** — Talk to me (SmartAid Assistant)
- 👤 **My Profile** — Edit your info, skills, availability

**Bottom stats:**
- **Pending needs** — unassigned needs count
- **Available vols** — ready volunteers count

- 🔴 **Logout** — sign out
`.trim(),

  ngo: `
🏢 **Guide for NGOs & Coordinators**

Welcome to SmartAid! Here's your recommended workflow:

**Getting started:**
1. **Post needs** → Needs → "+ Post Need" for each resource request
2. **Monitor progress** → Dashboard → track Pending / Assigned / Completed
3. **Assign volunteers** → Needs page → "🤖 AI Match" or "Assign" on each need
4. **Track locations** → Live Map → see where needs are vs. where volunteers are
5. **Manage team** → Volunteers page → see who is available right now
6. **Update your profile** → My Profile → keep location and skills current

**Key metrics to watch:**
- **Completion Rate** on Dashboard = your resolution efficiency
- **Pending count** = backlog needing urgent attention
- **Active Volunteers** = current available capacity

Just ask me anything — I'll guide you to the right page and action!
`.trim(),

};

// ══════════════════════════════════════════════════════════════
// SANITIZE
// ══════════════════════════════════════════════════════════════

function sanitize(input) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 1000).replace(/[<>]/g, "");
}

// ══════════════════════════════════════════════════════════════
// INTENT DETECTION
// ══════════════════════════════════════════════════════════════

function detectNeedIntent(text) {
  const lower = text.toLowerCase();
  const needTriggers = [
    "need", "require", "help with", "request", "asking for",
    "we need", "i need", "they need", "looking for", "can someone",
    "please send", "please provide", "we are looking", "send us",
  ];
  const hasNeedTrigger = needTriggers.some((t) => lower.includes(t));
  const domainEntry    = Object.entries(NEED_DOMAIN_MAP).find(([k]) => lower.includes(k));

  if (!hasNeedTrigger && !domainEntry) return { isNeed: false };

  const { type, matchSkills } = domainEntry
    ? domainEntry[1]
    : { type: "General", matchSkills: [] };

  let urgency = "Medium";
  if (URGENCY_SIGNALS.high.some((s) => lower.includes(s))) urgency = "High";
  else if (URGENCY_SIGNALS.low.some((s) => lower.includes(s))) urgency = "Low";

  return { isNeed: true, type, urgency, matchSkills };
}

function detectGuideIntent(text) {
  const lower = text.toLowerCase();
  const guideMap = [
    { keys: ["dashboard", "overview", "stats", "chart", "completion rate", "status distribution", "recent activity"], page: "dashboard" },
    { keys: ["post need", "create need", "add need", "new need", "submit need", "how to post", "how do i post"], page: "postNeed" },
    { keys: ["needs page", "active needs", "manage need", "filter need", "view needs", "list needs", "show needs", "all needs", "needs work"], page: "needs" },
    { keys: ["volunteer page", "volunteers page", "find volunteer", "show volunteer", "list volunteer", "available volunteer", "who can help", "show available volunteers"], page: "volunteers" },
    { keys: ["ai match", "how does matching", "how matching", "matching work", "auto assign", "ai matching", "how does ai match"], page: "aiMatch" },
    { keys: ["live map", "map view", "map work", "map page", "location map", "how does map", "map pin"], page: "liveMap" },
    { keys: ["profile", "edit profile", "my profile", "update profile", "change skill", "availability", "sub skill", "proof url", "how to edit profile"], page: "profile" },
    { keys: ["what can you do", "help me", "how do i", "ai chat", "chatbot", "assistant guide", "how to use chat"], page: "aiChat" },
    { keys: ["sidebar", "navigation", "menu", "navigate", "where is", "how to go", "how to navigate"], page: "sidebar" },
    { keys: ["ngo", "organization", "coordinator", "i am an ngo", "ngo guide", "coordinator guide", "how do i start"], page: "ngo" },
  ];
  for (const { keys, page } of guideMap) {
    if (keys.some((k) => lower.includes(k))) return page;
  }
  return null;
}

function detectVolunteerListIntent(text) {
  return ["show volunteers", "list volunteers", "available volunteers", "who is available", "show available volunteers"]
    .some((t) => text.toLowerCase().includes(t));
}

function detectNeedsListIntent(text) {
  return ["show needs", "list needs", "active needs", "all needs", "view needs", "what needs"]
    .some((t) => text.toLowerCase().includes(t));
}

function detectAssignIntent(text) {
  return ["assign", "match volunteer", "send volunteer", "allocate"]
    .some((t) => text.toLowerCase().includes(t));
}

// ══════════════════════════════════════════════════════════════
// VOLUNTEER HELPERS
// ══════════════════════════════════════════════════════════════

function getAvailableVolunteers(users = []) {
  return users.filter(
    (u) => u.role === "Volunteer" && u.status === "approved" && u.available === true
  );
}

function getMatchedVolunteers(volunteers, matchSkills = []) {
  if (!matchSkills.length) return volunteers;
  return volunteers.filter((v) => {
    const vSkills = [
      ...(v.skills || []),
      v.skill   || "",
      v.hobby   || "",
      v.role    || "",
    ].map((s) => s.toLowerCase());
    return matchSkills.some((ms) => vSkills.some((vs) => vs.includes(ms)));
  });
}

function formatVolunteers(volunteers) {
  if (!volunteers.length) return "_None found._";
  return volunteers
    .map((v, i) => {
      const name   = v.username || v.email?.split("@")[0] || "Unknown";
      const skills = [...(v.skills || []), v.skill, v.hobby].filter(Boolean).join(", ") || "General";
      const loc    = v.location || "Unknown";
      return `${i + 1}. **${name}** — ${skills} | 📍 ${loc}`;
    })
    .join("\n");
}

function formatNeeds(needs) {
  if (!needs.length) return "_No active needs._";
  return needs
    .map((n, i) => {
      const title  = n.title || n.type || "Unnamed";
      const urg    = n.urgency === "Critical" || n.urgency === "High" ? "🔴" : n.urgency === "Medium" ? "🟡" : "🟢";
      const status = n.status ? ` | ${n.status}` : "";
      return `${i + 1}. **${title}** [${n.type}] ${urg} ${n.urgency}${status} | 📍 ${n.location || "Unknown"}`;
    })
    .join("\n");
}

// ══════════════════════════════════════════════════════════════
// RESPONSE BUILDERS
// ══════════════════════════════════════════════════════════════

function buildNeedResponse({ type, urgency, matchSkills }, availableVolunteers) {
  const urgencyEmoji = urgency === "High" || urgency === "Critical" ? "🔴" : urgency === "Medium" ? "🟡" : "🟢";
  const matched      = getMatchedVolunteers(availableVolunteers, matchSkills);

  const guide = `🆘 **I understand — you need ${type} assistance.**

**Here's how to get help right now:**

**Step 1** → Go to **Needs** in the left sidebar
**Step 2** → Click **"+ Post Need"** (top-right button)
**Step 3** → Fill in:
  - **Type:** ${type}
  - **Urgency:** ${urgencyEmoji} ${urgency}
  - **Location** and **Quantity**
**Step 4** → Submit — volunteers are notified instantly`;

  let volunteerSection;
  if (!availableVolunteers.length) {
    volunteerSection = `

⚠️ **No volunteers are available right now.**
Your need will be queued and volunteers will be alerted as soon as someone becomes available.`;
  } else if (!matched.length) {
    volunteerSection = `

👥 **No volunteers with exact "${type}" skills available right now.**
But **${availableVolunteers.length} general volunteer(s)** are online and may still help:

${formatVolunteers(availableVolunteers.slice(0, 5))}

👉 After posting, click **"🤖 AI Match"** on the Needs page to auto-assign the best available volunteer.`;
  } else {
    volunteerSection = `

✅ **${matched.length} volunteer(s) matched for "${type}":**

${formatVolunteers(matched)}

👉 After posting your need, click **"🤖 AI Match"** on the Needs page to assign them instantly.`;
  }

  return guide + volunteerSection;
}

function buildVolunteerListResponse(volunteers) {
  if (!volunteers.length) {
    return `⚠️ **No volunteers are currently available.**\n\nPost your need anyway — they'll be notified when someone becomes available.\n\n👉 **Needs → + Post Need**`;
  }
  return `👥 **${volunteers.length} volunteer(s) currently available:**\n\n${formatVolunteers(volunteers)}\n\n👉 To assign: **Needs** page → click **"Assign"** or **"🤖 AI Match"** on any need.`;
}

function buildNeedsListResponse(needs) {
  if (!needs.length) return `📋 No active needs right now.\n\n👉 Post one: **Needs → + Post Need**`;
  return `📋 **Active Needs (${needs.length}):**\n\n${formatNeeds(needs)}\n\n👉 Go to the **Needs** page to filter, assign, or complete them.`;
}

function buildAssignResponse(needs, volunteers) {
  if (!needs.length)      return `No active needs to assign.\n\n👉 Post a need first: **Needs → + Post Need**`;
  if (!volunteers.length) return `⚠️ No volunteers available right now.\n\nPost the need anyway — volunteers will be alerted when they come online.`;

  return `**How to assign a volunteer:**

**Option A — AI Match (recommended):**
👉 **Needs** → find the need → click **"🤖 AI Match"**
The system picks the best-matched volunteer automatically.

**Option B — Manual:**
👉 **Needs** → find the need → click **"Assign"** → select a volunteer

---
**Active needs (${needs.length}):**
${formatNeeds(needs)}

**Available volunteers (${volunteers.length}):**
${formatVolunteers(volunteers)}`;
}

// ══════════════════════════════════════════════════════════════
// GROQ AI FALLBACK
// ══════════════════════════════════════════════════════════════

async function callGroqAI(message, context = {}) {
  const { needsCount = 0, volunteersCount = 0 } = context;

  const systemPrompt = `
You are SmartAid Assistant — an AI helper built into the SmartAid disaster-relief platform.

## Pages you know:
- Dashboard: stats (total needs, pending, assigned, completed, active volunteers, completion rate), bar chart by category, pie chart by status, recent activity
- Needs page: filter by status/type/urgency, search by title/location, "+ Post Need" button (top right), each card has "AI Match" and "Assign" buttons
- Volunteers page: list of approved available volunteers with skill tags and location, search bar at top
- Live Map: Google Map with red pins (needs) and green pins (volunteers), Map/Satellite toggle, Needs/Volunteers filter buttons top-right
- AI Chat: this chatbot with suggestion chips below the input box
- My Profile: edit username, role/hobby, location, phone, sub skills, bio, availability toggle, proof URL

## Live stats:
- Active needs: ${needsCount}
- Available volunteers: ${volunteersCount}

## Rules:
- Always name the exact page and button the user needs to click
- Be concise (under 120 words)
- Never fabricate volunteer names, need titles, or data
- If the user seems lost, give them the sidebar navigation guide
`.trim();

  const chat = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  return chat?.choices?.[0]?.message?.content?.trim() || "I didn't get a response. Please try again.";
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════

/**
 * SmartAid AI — Main handler
 *
 * Priority:
 *  1. Need expressed   → guide to post + show matched volunteers
 *  2. Guide request    → return page-specific guide
 *  3. Volunteer list   → show available volunteers
 *  4. Needs list       → show active needs
 *  5. Assign intent    → show assign guide + both lists
 *  6. Fallback         → Groq AI with full platform context
 *
 * @param {string} message  - Raw user message
 * @param {Array}  needs    - Active need objects from DB
 * @param {Array}  users    - All user objects from DB
 * @returns {Promise<string>}
 */
export async function askAI(message, needs = [], users = []) {
  const clean = sanitize(message);
  if (!clean) return "Please type a message so I can help you.";

  const availableVolunteers = getAvailableVolunteers(users);

  try {
    // 1. User expressing a need
    const needIntent = detectNeedIntent(clean);
    if (needIntent.isNeed) {
      return buildNeedResponse(needIntent, availableVolunteers);
    }

    // 2. Page / feature guide request
    const guidePage = detectGuideIntent(clean);
    if (guidePage && PAGE_GUIDES[guidePage]) {
      return PAGE_GUIDES[guidePage];
    }

    // 3. Volunteer list
    if (detectVolunteerListIntent(clean)) {
      return buildVolunteerListResponse(availableVolunteers);
    }

    // 4. Needs list
    if (detectNeedsListIntent(clean)) {
      return buildNeedsListResponse(needs);
    }

    // 5. Assignment
    if (detectAssignIntent(clean)) {
      return buildAssignResponse(needs, availableVolunteers);
    }

    // 6. Groq AI fallback
    return await callGroqAI(clean, {
      needsCount: needs.length,
      volunteersCount: availableVolunteers.length,
    });

  } catch (err) {
    console.error("❌ SmartAid AI Error:", err?.message || err);
    if (err?.status === 429) return "⚠️ AI is rate-limited right now. Please wait a moment and try again.";
    if (err?.status === 401) return "⚠️ AI authentication failed. Please check your API configuration.";
    return "⚠️ Something went wrong. Please try again or contact support.";
  }
}