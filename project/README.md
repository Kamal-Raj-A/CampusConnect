# CampusConnect

**CampusConnect** is a full-stack campus issue reporting, real-time tracking, and interactive navigation system designed for university campuses. It empowers students, faculty, and staff to report infrastructure or safety issues directly on an interactive map and provides campus administrators with a dashboard for tracking and resolution.

---

## Features

- **Interactive Campus Map**:
  - Visualize campus buildings, facilities, and points of interest with Leaflet.
  - Pinpoint issues by clicking directly on the map or choosing known campus landmarks.
  - View real-time status markers for reported issues (Open, In Progress, Resolved).
- **Issue Reporting Form**:
  - Report issues with title, category, description, urgency, and precise location coordinates.
  - Category tags: Maintenance, Cleanliness, Safety, IT / Network, Infrastructure, etc.
- **Admin & Staff Dashboard**:
  - Filter and inspect reported issues by status, priority, and date.
  - Analytics and summary metrics on campus health and resolution speed.
- **Campus Navigation**:
  - Step-by-step route and location assistance between campus facilities.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Mapping & Geolocation**: Leaflet, React-Leaflet, Leaflet Routing Machine
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `yarn`

### 2. Installation
Open your terminal in the `project` directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of `project/` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Running the Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173/` (or the port indicated in your terminal).

### 5. Production Build
To create an optimized production build:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## Project Structure

```
project/
├── index.html              # HTML entrypoint & metadata
├── package.json            # Dependencies and scripts
├── public/                 # Static assets & favicons
├── src/
│   ├── components/         # UI & Feature Components
│   │   ├── CampusMap.tsx            # Interactive Leaflet map
│   │   ├── CampusNavigationPanel.tsx # Route & directions panel
│   │   ├── Header.tsx               # Main navigation header
│   │   ├── IssueDashboard.tsx       # Issue metrics and management
│   │   └── IssueReportForm.tsx      # Report submission form
│   ├── data/
│   │   └── campusPlaces.ts          # Predefined campus POIs & coordinates
│   ├── lib/
│   │   ├── database.types.ts        # Database TypeScript schema
│   │   └── supabase.ts              # Supabase client setup
│   ├── App.tsx             # Root component & view router
│   ├── main.tsx            # Application mounting
│   └── index.css           # Global styles and Tailwind directives
└── supabase/
    └── migrations/         # Supabase SQL schema & migration scripts
```
