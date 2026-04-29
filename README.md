# 🛡️ Vanguard Threat Intelligence Dashboard

A professional-grade threat hunting workstation with real-time IoC ingestion from AlienVault OTX, ThreatFox, and more.

## 🚀 Quick Start (on Home Laptop)

### Option 1: Using Docker (Recommended)
This is the easiest way to bundle and run everything in one go.

1. Ensure you have **Docker** and **Docker Compose** installed.
2. Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```
3. Access the dashboard at [http://localhost:3001](http://localhost:3001) (Backend) and [http://localhost:5173](http://localhost:5173) (Frontend).

### Option 2: Local Node.js Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Backend Server**:
   ```bash
   npm run server
   ```
3. **Start Frontend Development**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
- `/src`: React + Vite Frontend
- `/server`: Express.js Backend + SQLite
- `/server/data`: Database storage (persistent volume in Docker)

## ⚡ Features
- Real-time IoC Feed Ingestion
- MITRE ATT&CK Heatmap
- Advanced Geo-Threat Mapping
- AI-Powered Hunting Hub
