# MediCore HMS 

This is the backend for the **Hospital Management Admin** (React/Vite admin panel). It mirrors
the app's modules 1:1 — Auth, Dashboard, OPD, IPD, Pharmacy, User Management, Setting  — so you can plug
it straight into the existing frontend with minimal changes.

## 1. Prerequisites

## Backend
- Node.js 18+ installed
- MongoDB running locally, with **MongoDB Compass** installed to inspect it visually
  - Easiest: install MongoDB Community Server, which runs a local `mongod` on `27017`
  - Then open Compass and connect to `mongodb://127.0.0.1:27017`

  ## Frontend
- React 19 + Vite
- React Router DOM (routing + protected routes)
- Tailwind CSS v4
- Axios (with interceptors for auth token + 401 handling)
- Context API (`AuthContext`)
- Chart.js / react-chartjs-2
- lucide-react (icons)

## 2. Install & configure

```bash
cd hms-backend
npm install

npm run seed
```

Demo login after seeding:
```
email: mntshrizvi@gmail.com
password: Admin@121
```


## 4. Run the server(Backend)

```bash
npm run dev     # nodemon, auto-restarts on changes
# or
npm start
```

You should see:
```
MongoDB Connected: 127.0.0.1/hms_db
HMS backend running on port 5000 [development]
```
## 5. Run the Frontend 
npm install
npm run dev      # start dev server
npm run build    # production build

## 6. Frontend status

The companion `Hospital-Management-UI` frontend has already been rewired to call this API
directly — every context now fetches from `/api/*` on mount and posts real requests on
save/edit/delete. Fully live: **Auth, OPD (patients/appointments/consultations), IPD
(wards/admissions/discharge/treatment records), Pharmacy (inventory/purchases/sales/alerts),
User Management (users/roles/permissions), and the Dashboard** (stats, charts, notifications,
recent admissions).

## Responsive behavior
- mobile responsiveness.
- Sidebar collapses to an off-canvas drawer below the `lg` breakpoint, toggled from the header.
- Auth screens hide the left signature panel on small screens.
- Tables scroll horizontally on narrow viewports.


## 7. Project structure

src/
├── components/
│   ├── common/       # Button, Input, Select, Modal, Table, Loader, Card, StatusBadge
│   ├── layout/       # Sidebar, Header, Layout, AuthLayout
│   └── dashboard/    # Module-specific: StatCard, RevenueChart, AppointmentChart,
│                     # DepartmentLoadChart, NotificationsPanel, QuickWidgets, DashboardToolbar
├── context/          # AuthContext (Context API)
├── data/             # Mock data per module (dashboardData.js, ...) — swap for API calls later
├── pages/
│   ├── auth/         # Login, ForgotPassword
│   ├── dashboard/    # Dashboard, Placeholder (for modules not yet built)
│   └── NotFound.jsx
├── routes/           # AppRoutes, ProtectedRoute
├── services/         # api.js (Axios instance)
├── hooks/            # (reserved for shared hooks)
└── index.css         # Tailwind + design tokens
```

```
hms-backend/
├── server.js                  # app entry point
├── src/
│   ├── config/db.js           # Mongoose connection
│   ├── models/                # one file per collection
│   ├── controllers/           # business logic per module
│   ├── routes/                # Express routers per module
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + role-based authorize
│   │   └── errorHandler.js    # centralized error responses
│   └── utils/
│       ├── asyncHandler.js
│       ├── generateToken.js
│       └── seed.js            # npm run seed
```


