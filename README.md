# EcoPulse SmartBin OS 🌿🗑️

> **Next-Generation IoT Waste Segregation & Municipal Fleet Dispatch Platform**  
> Dual waste tracking (**Compostable** vs. **Decomposable**), 3D interactive dustbins, citizen eco-rewards, and an automated municipal fleet dispatch engine.

---

## 🌐 Separate Portals & Clean Routing

EcoPulse SmartBin OS strictly isolates citizen engagement from municipal operations:

| Portal | URL Path | Audience & Capabilities |
| :--- | :--- | :--- |
| **Citizen Eco-Portal** | `/` (`index.html`) | Public citizens. Check live fill levels, interact with realistic 3D motorized dustbins (touchless IR wave / foot pedal), test items with AI waste sorter, earn Citizen Eco-Points, and report overflow issues. |
| **Municipal Admin Panel** | `/admin` (`admin.html`) | Sanitation officers & fleet dispatchers. Protected by security authentication gate (`admin` / `admin123`), multi-station fleet monitoring, interactive Leaflet dispatch map, TSP route optimization, turn-by-turn driver HUD, sensor diagnostics, and CSV data export. |

---

## 🚀 Quick Start & How to Run

Zero external dependencies required! Choose either Node.js or Python:

### Option A: Using Node.js (Recommended)
```bash
node server.js
```
- **Citizen Portal**: [http://localhost:3000/](http://localhost:3000/)
- **Municipal Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin) *(direct requests to `/admin.html` are automatically redirected to `/admin`)*
- **REST Telemetry API**: [http://localhost:3000/api/bins](http://localhost:3000/api/bins)

### Option B: Using Python 3
```bash
python server.py
```
- Runs identically on [http://localhost:3000/](http://localhost:3000/) and [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 🔑 Municipal Admin Credentials

- **Officer Username:** `admin` (or `officer`)
- **Passcode:** `admin123` (or `admin`)

---

## ♻️ Waste Segregation Categories

1. **🌿 Compostable Waste (Wet Organic)**
   - Food scraps, fruit peels, vegetable waste, coffee grounds, eggshells, garden clippings.
   - Ideal for biomethanation and organic compost generation.
   - Standard 60L capacity chamber with ultrasonic distance sensing & temperature monitoring.

2. **📦 Decomposable Waste (Dry Fibers)**
   - Corrugated cardboard, unlaminated craft paper, fallen leaves, untreated wood shavings, cotton rags.
   - Biodegradable via industrial pulp shredding and natural microbial breakdown.
   - Standard 80L capacity chamber with ultrasonic distance sensing & humidity monitoring.

---

## 📡 IoT Hardware & API Ingestion

### ESP32 Firmware
A complete Arduino/ESP32 sketch is provided under [`hardware/esp32_smartbin.ino`](./hardware/esp32_smartbin.ino). It uses:
- Dual **HC-SR04** ultrasonic distance sensors
- **WiFiClient** & **HTTPClient** to transmit telemetry every 5 seconds to `POST /api/bins/update`

### REST Endpoints
- `GET /api/bins` - Retrieve real-time telemetry of active demo bin.
- `POST /api/bins/update` - Ingest live JSON sensor readings.
- `GET /api/stations` - Retrieve all 5 municipal stations and hub location.
- `POST /api/stations/update` - Update telemetry for a specific station by ID.
- `GET /api/routes` & `POST /api/routes/optimize` - Calculate optimal Traveling Salesperson pickup route with fuel savings and turn-by-turn waypoints.
- `GET /api/reports` & `POST /api/reports` - Fetch and log citizen overflow and maintenance reports.

---

## 🗺️ Multi-Station Fleet & Route Optimization

The Municipal Admin panel monitors 5 distinct city locations:
1. **BIN-101**: University Food Court & Cafeteria (Campus Area)
2. **BIN-102**: Tech Park & Corporate Plaza (IT Corridor)
3. **BIN-103**: Metro Transit & City Plaza (Commercial Zone)
4. **BIN-104**: Green Civic Hub & Botanical Garden (Eco Park)
5. **BIN-105**: City General Hospital & Medical Zone (Health Quarter)

### Fleet Route Capabilities
- **Priority TSP Route (≥75% Full)**: Computes the shortest pickup circuit starting from the **Central Municipal Bio-Composting Plant** using a Euclidean Nearest-Neighbor TSP algorithm.
- **Routine Sweep (All 5 Stations)**: Full-circuit collection route to sanitize all city stations.
- **Direct Dispatch**: Send collection truck directly to an individual station from its map popup.
- **Recall Truck / Cancel Route**: Stop active collection and recall the vehicle to the depot.
- **Citizen Walking Route**: Public users can click "Route to Selected Bin" to get instant pedestrian directions, walking time (~2 mins), and distance in meters.
- **Live Driver Navigation HUD**: Turn-by-turn waypoint manifest, fuel saved (~0.42L/km), and automated bin emptying upon arrival.

---

## 📄 License
MIT License. Built for modern sustainable smart cities.