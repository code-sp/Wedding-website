# 💍 Wedding RSVP & Invitation Platform

A full-stack, multi-tenant wedding invitation and RSVP management platform. Built to be deployed per-couple, it offers a personalized digital experience — from a cinematic landing page and animated story timeline to event listings, a live photo gallery, and a full guest management dashboard.

---

## ✨ Features

### Guest-Facing
- 🏠 **Landing Page** — Elegant animated entry with couple details and countdown timer
- 📖 **Our Story** — Scrollable timeline with image & text milestones
- 📅 **Events** — Multi-event cards with venue, date/time, and dress-code details
- 🖼️ **Gallery** — Admin-curated photo gallery with lightbox viewer
- 📸 **Moments** — Crowd-sourced guest photo uploads
- 🌳 **Family Tree** — Interactive visual family tree for both families
- 📬 **Contact** — Venue and contact information page
- ✍️ **RSVP / Registration** — Multi-step form with meal preferences, guest counts, room & table booking

### Admin Panel
- 🔐 **Role-Based Access Control** — `admin`, `client`, and `user` roles
- ⚙️ **Portal Settings** — Toggle visible tabs, update couple info, manage access codes
- 👥 **Guest Directory** — View, filter, and manage all RSVPs with export capability
- 📋 **Master Directory** — Manage multiple client portals from a single admin account
- 📁 **Content Management** — Upload and delete photos/events directly from the UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Tailwind CSS v3, custom brand palette |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB (via Mongoose) |
| **Auth** | Custom access-code system with `crypto-js` |
| **Image Compression** | Client-side compression before upload |
| **Dev Tooling** | ESLint, Concurrently, Autoprefixer |

---

## 📁 Project Structure

```
invitation2/
├── server/
│   ├── index.js              # Express app entry, DB seeding
│   ├── models.js             # Mongoose schemas (User, RSVP, Content, Client, AllowedGuest)
│   ├── defaults.js           # Seed data (default events, gallery, stories, home)
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # Route handler logic
│   └── routes/
│       ├── authRoutes.js     # POST /api/login, GET /api/users
│       ├── contentRoutes.js  # GET/POST/DELETE /api/content/:key
│       ├── rsvpRoutes.js     # POST /api/rsvp, GET /api/rsvps
│       ├── guestRoutes.js    # GET /api/guests
│       └── clientRoutes.js   # GET/POST /api/clients
│
├── src/
│   ├── App.jsx               # Root router with role-based route guards
│   ├── main.jsx              # React entry point
│   ├── index.css             # Global styles
│   ├── context/
│   │   ├── AuthContext.jsx   # Authentication state & login logic
│   │   └── ImageContext.jsx  # Global content state (events, gallery, stories, settings)
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility helpers (image compression, etc.)
│   ├── assets/               # Static assets
│   └── components/
│       ├── LandingPage.jsx   # Public entry page
│       ├── Home.jsx          # Post-login home/dashboard
│       ├── Story.jsx         # Our Story timeline
│       ├── Events.jsx        # Events listing
│       ├── Gallery.jsx       # Curated photo gallery
│       ├── Moments.jsx       # Guest-uploaded photos
│       ├── FamilyTree.jsx    # Interactive family tree
│       ├── Contact.jsx       # Contact & venue info
│       ├── Registration.jsx  # Multi-step RSVP form
│       ├── Navbar.jsx        # Responsive navigation
│       ├── PortalSettings.jsx # Admin: settings control panel
│       ├── GuestDirectory.jsx # Admin/Client: RSVP list
│       ├── ClientDirectory.jsx # Admin: multi-client management
│       ├── Countdown.jsx     # Wedding countdown widget
│       ├── Toast.jsx         # Notification system
│       ├── ErrorBoundary.jsx # React error boundary
│       └── common/           # Shared/reusable components
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 🗄️ Database Schemas

### `User`
| Field | Type | Description |
|---|---|---|
| `_id` | String | Custom ID (`admin`, `user_01`, etc.) |
| `role` | String | `admin`, `client`, or `user` |
| `clientId` | String | Associated client portal |
| `name` | String | Display name |
| `access_code` | String | Unique login code |
| `is_registered` | Boolean | Has completed RSVP? |
| `rsvp_data` | Object | Full RSVP JSON blob |

### `Content` (Key-Value Store)
| Field | Type | Description |
|---|---|---|
| `key` | String | e.g. `events`, `gallery`, `stories` |
| `clientId` | String | Tenant isolation |
| `value` | Mixed | Array of items for that collection |

> Content keys seeded by default: `events`, `gallery`, `stories`, `home_data`, `family_people`, `family_families`, `family_links`, `groom_family_people`, `groom_family_families`, `groom_family_links`

### `RSVP`
Stores individual RSVP submissions linked to a `User` and `clientId`, with a full `data` JSON object.

### `Client`
Multi-tenant client record: `name`, `occasion`, `brideName`, `groomName`, `status`, etc.

### `AllowedGuest`
Pre-approved guest list per client, with claim tracking.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB Community** (local instance)
- **npm** v9+

### 1. Install MongoDB (macOS)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application

**Option A — Start everything at once:**
```bash
npm start
```
This uses `concurrently` to run both the backend server and the Vite frontend simultaneously.

**Option B — Start separately:**

Terminal 1 (Backend):
```bash
npm run server
# Wait for: "MongoDB Connected: 127.0.0.1"
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## 🔐 Auth & Roles

The platform uses a **custom access-code login** (no email/password). Users are pre-seeded by the admin.

| Role | Access |
|---|---|
| `admin` | All routes, all settings, all client portals |
| `client` | RSVP directory for their own portal |
| `user` | All guest-facing tabs (based on enabled tabs) |

Route guards enforced at the React Router level:
- `AdminRoute` — Admin only
- `PortalManagementRoute` — Admin or Client
- `ProtectedRoute` — Any authenticated user
- `TabGuard` — Checks if the tab is enabled in portal settings

---

## 🌐 API Reference

All routes are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate with an access code |
| `GET` | `/api/users` | List all users (admin) |
| `GET` | `/api/content/:key` | Fetch content by key (e.g. `events`) |
| `POST` | `/api/content/:key` | Add an item to a content collection |
| `DELETE` | `/api/content/:key/:id` | Remove an item from a collection |
| `POST` | `/api/rsvp` | Submit an RSVP |
| `GET` | `/api/rsvps` | List all RSVPs (admin/client) |
| `GET` | `/api/guests` | List allowed guests |
| `GET` | `/api/clients` | List all client portals (admin) |
| `POST` | `/api/clients` | Create a new client portal (admin) |
| `GET` | `/api/health` | Health check |

---

## 🎨 Design System

The app uses a **Lattice-inspired minimal palette** defined in `tailwind.config.js`:

| Token | Color | Usage |
|---|---|---|
| `brand.black` | `#1a1a1a` | Primary text |
| `brand.dark` | `#2d2d2d` | Dark backgrounds |
| `brand.gray` | `#f4f2ed` | Warm light background |
| `brand.cream` | `#f9f8f6` | Card & page backgrounds |
| `brand.accent` | `#3c4043` | Borders, secondary text |

**Typography:** Inter (sans), DM Sans (display & headings)

---

## 📜 NPM Scripts

| Script | Description |
|---|---|
| `npm start` | Start backend + frontend concurrently |
| `npm run server` | Start Express backend only (port 3000) |
| `npm run dev` | Start Vite frontend only (port 5173) |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint on all JS/JSX files |

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot connect to MongoDB` | Run `brew services start mongodb-community` and wait a few seconds |
| Port 3000 or 5173 already in use | Run `pkill -f node` to kill any rogue Node processes |
| Blank screen on load | Check browser console — usually a missing `.env` or backend not running |
| Images not uploading | Ensure Express body limit is `50mb` (already set); check MongoDB connection |

---

## 🗺️ Roadmap

See [`GENERALIZATION_PLAN.md`](./GENERALIZATION_PLAN.md) for the active refactoring plan, which includes:
- [ ] **`MediaGridTemplate.jsx`** — A single generic component to replace duplicated Gallery/Moments/Events/Story logic
- [ ] **Unified Context API** — `updateContentData(key, item)` / `deleteContentData(key, id)`  
- [ ] **Lazy Loading** — All media images use `loading="lazy"` for faster initial load  
- [ ] **Memoization** — `React.memo` on media pages to prevent unnecessary re-renders  

---

## 🔒 Protected Components

To maintain design consistency and avoid regression on finalized features, the following components are currently **Locked**. Do not modify these files unless explicitly instructed by the user:

-   **`src/components/Home.jsx`**: Layout, grid structure, and countdown positioning are final.
-   **`src/components/Story.jsx`**: 3D Carousel math, card geometry, fluid scrolling, and inline-editing UX are final.

---

## 🧪 Testing Standards

To maintain high-fidelity micro-interactions and pixel-perfect design across all devices, the following standards must be followed during development:

1.  **Multi-Device Verification**: Always test changes for both **Mobile** (handheld) and **Desktop** (website) views.
2.  **Orientation Testing**: Verify UI stability across **Portrait** and **Landscape** modes on mobile devices.
3.  **Dynamic Responsiveness**: 
    *   Avoid hardcoded pixel values for layout offsets or container sizes.
    *   Prefer **Dynamic Values** (e.g., calculations based on `window.innerWidth/Height`) to ensure elements behave consistently during browser resizing.
    *   The UI should never "break" or overlap when transitioning from full-screen to windowed mode.
4.  **Interaction Stability**: Ensure that state updates (e.g., image uploads, form inputs) do not cause UI elements to "jump" or shift unexpectedly from their centered/anchored positions.

---

## 📄 License

Private project. All rights reserved.
