# AI-Powered Civic Complaint Management and Resolution Platform

**Academic Project Type:** MCA Mini Project (Full-Stack Web Application)  
**Architecture:** Modern MERN Architecture (MongoDB, Express.js, React.js, Node.js) + Google Gemini Vision AI  

---

## 🏛️ Executive Summary & Abstract

Rapid urbanization has exacerbated civic infrastructure issues such as potholes, garbage accumulation, malfunctioning streetlights, and clogged drainage networks. Traditional municipal grievance systems suffer from manual classification overhead, lack of geographic verification, citizen apathy, and redundant duplicate complaints.

**CivicSense** is a full-stack municipal civic complaint management and resolution platform. It bridges citizens and city administrators through automated **Google Gemini AI Vision analysis**, browser-based **GPS geolocation**, mathematical **duplicate detection (Haversine distance)**, **automated departmental routing**, **in-app notification dispatches**, and a **civic gamification reward points model**.

---

## 📦 Four Major Functional Modules

The project is architected strictly into four core modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN PROJECT ARCHITECTURE                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. AUTHENTICATION &      │ • Citizen Registration & JWT Login          │
│    CITIZEN MANAGEMENT    │ • Role Distinction (Citizen vs Admin)       │
│                          │ • Profile & Historical Complaints Timeline  │
│                          │ • Gamified Reward Points & Leaderboard      │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 2. CIVIC COMPLAINT       │ • Image Upload with Instant Preview         │
│    MANAGEMENT            │ • Google Gemini Vision AI Image Analysis    │
│                          │ • HTML5 GPS Geolocation & Map Pinpoint      │
│                          │ • Haversine Duplicate Detection (<= 100m)   │
│                          │ • Citizen Upvote / Support Functionality    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. COMPLAINT ROUTING &   │ • Automated Category-to-Department Routing  │
│    NOTIFICATION          │ • Municipal Service Level Agreement (SLA)   │
│                          │ • Multi-Stage Status Lifecycle Audit Trail  │
│                          │ • Event-Driven In-App Notification Engine   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 4. ADMIN MANAGEMENT      │ • Municipal Admin Dashboard & Key Metrics   │
│                          │ • Filterable Triage & Status Update Modal   │
│                          │ • Citizen Participation Directory           │
│                          │ • Department Routing & SLA Management       │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 🔄 End-to-End System Workflow

```mermaid
flowchart TD
    A[Citizen Opens Platform] --> B[Register / Login via JWT]
    B --> C[Report Civic Issue]
    C --> D[Upload Photo + Automatic GPS Capture]
    D --> E[Backend Calls Google Gemini Vision AI]
    E --> F[Identify Category & Severity]
    F --> G{Duplicate Check: Haversine <= 100m?}
    G -- Yes (Duplicate Found) --> H[Prompt Citizen to Support / Upvote Existing Ticket]
    H --> I[Citizen Upvotes (+5 Reward Points)]
    G -- No (Unique Issue) --> J[Create Complaint & Award +20 Reward Points]
    J --> K[Automatic Routing to Responsible Municipal Department]
    K --> L[Admin Dashboard Receives Ticket]
    L --> M[Admin Triage & Field Crew Dispatch]
    M --> N[Status: Under Review -> Assigned -> In Progress -> Resolved]
    N --> O[Citizen Receives In-App Notification]
    O --> P[Issue Resolved: Citizen Receives +50 Bonus Reward Points]
```

---

## 🤖 1. AI Detection (Google Gemini API)

- **Engine:** Google Gemini Vision (`gemini-1.5-flash` via `@google/generative-ai`)
- **Input:** Image buffer/base64 + optional citizen description notes.
- **Output:**
  1. **Category:** `Pothole`, `Garbage Overflow`, `Broken Streetlight`, `Drainage Issue`, or `Other`.
  2. **Severity Level:** `Low`, `Medium`, `High`, or `Critical`.
  3. **Confidence Score:** e.g., `0.95 (95%)`.
  4. **Summary:** 1-2 sentence damage assessment for municipal field workers.
- **Zero-Failure Fallback:** If the `GEMINI_API_KEY` is not provided or quota/network fails during an offline college viva, the system automatically falls back to an internal heuristic vision analyzer so the demonstration never breaks.

---

## 📍 2. Geolocation, Maps & Duplicate Detection

### GPS & Maps Integration
- Captures exact coordinates (`latitude` and `longitude`) using the browser's HTML5 `navigator.geolocation` API.
- Visualizes complaints on an interactive **Leaflet / OpenStreetMap** component with color-coded category markers.
- Features a **"View on Google Maps"** navigation button pointing directly to coordinates (`https://www.google.com/maps?q=lat,lng`).

### Mathematical Duplicate Detection Algorithm
The duplicate engine prevents municipal resource drain by preventing redundant tickets:
1. **Category Match:** Candidate category must equal existing unresolved category.
2. **Status Filter:** Only inspects unresolved complaints (`Submitted`, `Under Review`, `Assigned`, `In Progress`).
3. **Haversine Distance Formula:**
   $$\Delta \text{lat} = \text{lat}_2 - \text{lat}_1, \quad \Delta \text{lon} = \text{lon}_2 - \text{lon}_1$$
   $$a = \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)$$
   $$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a})$$
   $$d = R \cdot c \quad (R = 6,371,000 \text{ meters})$$
4. If distance $d \le 100\text{ meters}$, an interactive dialog alerts the citizen and allows them to **Support / Upvote** the existing ticket instead of creating duplicates.

---

## 🏢 3. Department Routing & Status Management

### Departmental Routing Rules
- **Pothole** $\rightarrow$ `Roads & Highway Maintenance Department` (SLA: 48h)
- **Garbage Overflow** $\rightarrow$ `Waste Management & Sanitation Department` (SLA: 24h)
- **Broken Streetlight** $\rightarrow$ `Electrical & Public Lighting Department` (SLA: 36h)
- **Drainage Issue** $\rightarrow$ `Stormwater Drainage & Sewerage Department` (SLA: 48h)
- **Other** $\rightarrow$ `Municipal Grievance Cell` (SLA: 72h)

### Status Lifecycle & Rewards
- `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`
- **Reward Points System:**
  - Register as Citizen: **+10 Points**
  - Submit Verified Complaint: **+20 Points**
  - Support / Upvote Community Issue: **+5 Points**
  - Complaint Author when Upvoted: **+2 Points**
  - Complaint Marked Resolved: **+50 Bonus Points**

---

## 🔑 Evaluation & Viva Test Accounts

Pre-seeded database accounts for instant examination:

| Role | Email | Password | Pre-seeded Features |
| :--- | :--- | :--- | :--- |
| **Municipal Admin** | `admin@civic.gov` | `Admin@123` | Full dashboard metrics, status updater, citizen directory |
| **Demo Citizen 1** | `rahul.sharma@example.com` | `Citizen@123` | 85 Reward Points, Indiranagar area |
| **Demo Citizen 2** | `priya.patel@example.com` | `Citizen@123` | 60 Reward Points, Koramangala area |
| **Demo Citizen 3** | `ananya.verma@example.com` | `Citizen@123` | 35 Reward Points, Whitefield area |

*(Both login forms include a single-click **"Quick Demo Autofill"** button for instant viva logins.)*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- *Note:* Local MongoDB is **NOT** strictly required! If local MongoDB is not found on your system, the server automatically boots an **embedded in-memory MongoDB** instance for zero-configuration testing.

### Option 1: 1-Click Startup (Windows)
Double-click `run-project.bat` or run:
```powershell
.\run-project.ps1
```

### Option 2: Manual Startup

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` with health check at `http://localhost:5000/api/health`.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new citizen |
| `POST` | `/api/auth/login` | Public | Citizen or Admin login |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile & stats |
| `PUT` | `/api/auth/profile` | Private | Update citizen name, phone, address |
| `GET` | `/api/complaints` | Public | Public feed & map pins (with filters) |
| `GET` | `/api/complaints/my` | Citizen | Current citizen's submitted complaints |
| `POST` | `/api/complaints` | Citizen | Submit complaint with photo upload |
| `POST` | `/api/complaints/:id/upvote` | Citizen | Upvote/support an existing complaint |
| `GET` | `/api/complaints/:id` | Public | Full complaint details & audit trail |
| `GET` | `/api/admin/stats` | Admin | Dashboard summary metrics & counts |
| `PUT` | `/api/admin/complaints/:id/status` | Admin | Update status & record admin remarks |
| `GET` | `/api/admin/citizens` | Admin | View all registered citizens & scores |
| `GET` | `/api/admin/departments` | Admin | View departments & SLA information |
| `GET` | `/api/notifications` | Private | Retrieve citizen in-app notifications |
| `PUT` | `/api/notifications/:id/read` | Private | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | Private | Mark all notifications as read |

---

## 🎓 Academic Viva Q&A Cheat Sheet

1. **Q: Why is Gemini Vision used instead of a custom trained CNN model?**  
   *A:* Multimodal Large Language Models like Google Gemini provide zero-shot infrastructure defect detection with contextual severity reasoning, eliminating the need to collect, label, and train thousands of municipal images while remaining adaptable to new categories without retraining.

2. **Q: How does the system handle duplicate complaints?**  
   *A:* Using the mathematical Haversine formula, the backend queries active complaints in the same category within a 100-meter radius. If found, citizens are encouraged to upvote the existing ticket with +5 reward points, consolidating community voice and preventing redundant municipal tickets.

3. **Q: How is security handled?**  
   *A:* Passwords are protected using `bcryptjs` salt rounds (10), while authentication uses JSON Web Tokens (JWT) with role-based middleware guards (`citizen` vs `admin`).

4. **Q: What happens if there is no internet or no Gemini API key configured during evaluation?**  
   *A:* The system is designed with high fault tolerance. It detects missing API credentials or connection failures and seamlessly activates its civic heuristic vision engine, ensuring 100% uninterrupted demonstration.
