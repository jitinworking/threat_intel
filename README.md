# Threat Intelligence Platform v4

Welcome to the modernized Threat Intelligence Platform. This application provides a comprehensive, enterprise-grade suite for monitoring and analyzing cyber threats, vulnerabilities, and geopolitical risks.

## Features Included
- **Global Threat GeoMap:** Interactive WebGL 3D map with live attack paths and clustering.
- **Intelligence Reports Portal:** A4 PDF generator with embedded analytics and scheduling engine.
- **Threat Copilot:** AI-assisted sidebar for instant context on IoCs and APT groups.
- **Dark Web Monitor:** Search and correlate corporate identities against data breaches.
- **Vulnerability Intelligence (CVE Feed):** NVD registry mapped with CISA KEV and EPSS indexes.
- **Hunting Hub:** Turn TTPs into actionable KQL and SPL queries for Sentinel/Splunk.
- **Enterprise Design System:** Fully unified UI with dynamic Light/Dark mode transitions.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts, MapLibre GL.
- **Backend:** Node.js, Express, SQLite3 (with TTL caching and Rate Limiting).
- **Architecture:** Monolithic repository structure with hardened middleware.

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone or extract this repository to your local machine.
2. Open a terminal in the root folder of the project.
3. Install all dependencies:
   ```bash
   npm install
   ```

### Running the Application Locally
You will need to run both the frontend and backend servers simultaneously.

**Terminal 1 (Backend Server):**
Starts the Node.js backend on `http://localhost:3001`
```bash
npm run server
```

**Terminal 2 (Frontend Server):**
Starts the Vite dev server for the React application on `http://localhost:5173`
```bash
npm run dev
```

Navigate your browser to `http://localhost:5173` to view the platform!

## Code Architecture Note
All UI elements rely on the `src/components/ui/design-system.tsx` for visual consistency. Ensure you utilize the semantic CSS variables (`bg-background`, `bg-paper`, `text-foreground`, etc.) located in `index.css` when building new components to maintain flawless Light/Dark mode toggling.
