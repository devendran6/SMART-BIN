/**
 * EcoPulse SmartBin OS - Local Standalone Server
 * Zero-dependency Node.js HTTP & REST API server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// In-memory IoT telemetry state
let binState = {
  binId: "BIN-104",
  location: "Green Civic Hub, Sector 4",
  compostable: {
    name: "Compostable Waste (Wet Organic)",
    fillPercent: 68,
    distanceCm: 32,
    weightKg: 16.8,
    temperatureC: 38.5,
    maxCapacityL: 60,
    status: "Optimal"
  },
  decomposable: {
    name: "Decomposable Waste (Dry Fibers)",
    fillPercent: 42,
    distanceCm: 58,
    weightKg: 9.4,
    humidityPercent: 44,
    maxCapacityL: 80,
    status: "Optimal"
  },
  lastUpdated: new Date().toISOString()
};

const CENTRAL_HUB = {
  id: "HUB-01",
  name: "Central Municipal Bio-Composting Plant",
  type: "facility",
  coords: [12.9716, 77.5946],
  description: "Main anaerobic digestion and pulp processing facility"
};

let stationsState = {
  "BIN-101": {
    id: "BIN-101",
    name: "University Food Court & Cafeteria",
    zone: "Sector 1 • Campus Area",
    coords: [12.9820, 77.5880],
    batteryPercent: 94,
    solarCharging: true,
    lastPing: "Just now",
    compostable: { fillLevel: 88, weightKg: 22.4, temperatureC: 41.2, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 42, weightKg: 8.6, humidityPercent: 40, totalHeightCm: 100, maxCapacityLiters: 80 }
  },
  "BIN-102": {
    id: "BIN-102",
    name: "Tech Park & Corporate Plaza",
    zone: "Sector 3 • IT Corridor",
    coords: [12.9640, 77.6110],
    batteryPercent: 98,
    solarCharging: true,
    lastPing: "1 min ago",
    compostable: { fillLevel: 32, weightKg: 7.8, temperatureC: 34.0, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 84, weightKg: 19.5, humidityPercent: 38, totalHeightCm: 100, maxCapacityLiters: 80 }
  },
  "BIN-103": {
    id: "BIN-103",
    name: "Metro Transit & City Plaza",
    zone: "Sector 2 • Commercial Zone",
    coords: [12.9910, 77.6080],
    batteryPercent: 91,
    solarCharging: false,
    lastPing: "Just now",
    compostable: { fillLevel: 56, weightKg: 13.8, temperatureC: 37.0, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 64, weightKg: 14.2, humidityPercent: 42, totalHeightCm: 100, maxCapacityLiters: 80 }
  },
  "BIN-104": {
    id: "BIN-104",
    name: "Green Civic Hub & Botanical Garden",
    zone: "Sector 4 • Eco Park",
    coords: [12.9850, 77.6100],
    batteryPercent: 96,
    solarCharging: true,
    lastPing: "Just now",
    compostable: { fillLevel: 68, weightKg: 16.8, temperatureC: 38.5, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 42, weightKg: 9.4, humidityPercent: 44, totalHeightCm: 100, maxCapacityLiters: 80 }
  },
  "BIN-105": {
    id: "BIN-105",
    name: "City General Hospital & Medical Zone",
    zone: "Sector 5 • Health Quarter",
    coords: [12.9580, 77.5850],
    batteryPercent: 99,
    solarCharging: true,
    lastPing: "2 mins ago",
    compostable: { fillLevel: 25, weightKg: 5.4, temperatureC: 32.0, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 30, weightKg: 6.2, humidityPercent: 45, totalHeightCm: 100, maxCapacityLiters: 80 }
  }
};

let reportsState = [];

function getHaversineDistance(coords1, coords2) {
  const R = 6371;
  const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
  const dLng = (coords2[1] - coords1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateOptimalRoute(targetStations = null) {
  const stationsToVisit = targetStations || Object.values(stationsState).filter(s =>
    s.compostable.fillLevel >= 75 || s.decomposable.fillLevel >= 75
  );
  
  const waypoints = [CENTRAL_HUB];
  let unvisited = [...(stationsToVisit.length > 0 ? stationsToVisit : Object.values(stationsState))];
  let currentPoint = CENTRAL_HUB.coords;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = getHaversineDistance(currentPoint, unvisited[i].coords);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    const nextStation = unvisited.splice(nearestIdx, 1)[0];
    waypoints.push(nextStation);
    currentPoint = nextStation.coords;
  }

  waypoints.push(CENTRAL_HUB);

  let totalDistanceKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistanceKm += getHaversineDistance(waypoints[i].coords, waypoints[i + 1].coords);
  }

  const fuelSavedLiters = parseFloat((totalDistanceKm * 0.42).toFixed(1));

  return {
    waypoints,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    stopsCount: waypoints.length - 2,
    fuelSavedLiters,
    generatedAt: new Date().toISOString()
  };
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS for IoT clients (ESP32, Postman, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // --- REST API ENDPOINTS ---
  if (pathname === '/api/bins' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(binState, null, 2));
    return;
  }

  // IoT Hardware Endpoint: POST /api/bins/update
  if (pathname === '/api/bins/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.compostable) {
          binState.compostable.fillPercent = payload.compostable.fillPercent ?? binState.compostable.fillPercent;
          binState.compostable.distanceCm = payload.compostable.distanceCm ?? binState.compostable.distanceCm;
          binState.compostable.weightKg = payload.compostable.weightKg ?? binState.compostable.weightKg;
        }
        if (payload.decomposable) {
          binState.decomposable.fillPercent = payload.decomposable.fillPercent ?? binState.decomposable.fillPercent;
          binState.decomposable.distanceCm = payload.decomposable.distanceCm ?? binState.decomposable.distanceCm;
          binState.decomposable.weightKg = payload.decomposable.weightKg ?? binState.decomposable.weightKg;
        }
        binState.lastUpdated = new Date().toISOString();

        console.log(`[IoT INGEST] Bin ${binState.binId} Telemetry Updated: Comp=${binState.compostable.fillPercent}%, Decomp=${binState.decomposable.fillPercent}%`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Telemetry updated successfully", state: binState }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // Multi-Station Fleet Endpoints: GET /api/stations
  if (pathname === '/api/stations' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hub: CENTRAL_HUB,
      stations: stationsState,
      totalCount: Object.keys(stationsState).length
    }, null, 2));
    return;
  }

  // Update specific station: POST /api/stations/update
  if (pathname === '/api/stations/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const stationId = payload.stationId || payload.id;
        if (stationId && stationsState[stationId]) {
          if (payload.compostable) Object.assign(stationsState[stationId].compostable, payload.compostable);
          if (payload.decomposable) Object.assign(stationsState[stationId].decomposable, payload.decomposable);
          if (payload.batteryPercent !== undefined) stationsState[stationId].batteryPercent = payload.batteryPercent;
          stationsState[stationId].lastPing = "Just now";
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, station: stationsState[stationId] }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Station ID not found" }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // Route Optimization API: GET & POST /api/routes or /api/routes/optimize
  if ((pathname === '/api/routes' || pathname === '/api/routes/optimize' || pathname === '/api/route') && (req.method === 'GET' || req.method === 'POST')) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const targetStations = payload.stations || null;
          const result = calculateOptimalRoute(targetStations);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, route: result }, null, 2));
        } catch (err) {
          const result = calculateOptimalRoute();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, route: result }, null, 2));
        }
      });
      return;
    } else {
      const result = calculateOptimalRoute();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, route: result }, null, 2));
      return;
    }
  }

  // Citizen Issue Reports: GET & POST /api/reports
  if (pathname === '/api/reports') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reports: reportsState, total: reportsState.length }, null, 2));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        let payload = {};
        try {
          payload = JSON.parse(body);
        } catch (e) {
          try {
            payload = JSON.parse(decodeURIComponent(body));
          } catch (e2) {
            payload = { notes: body };
          }
        }
        const newReport = {
          id: `REP-${Date.now().toString().slice(-4)}`,
          stationId: payload.stationId || "BIN-104",
          issueType: payload.issueType || "Overflow",
          notes: payload.notes || "",
          timestamp: new Date().toISOString(),
          status: "Pending Dispatch"
        };
        reportsState.unshift(newReport);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Report logged", report: newReport }));
      });
      return;
    }
  }

  // --- STATIC FILE & ROUTE SERVER ---
  if (pathname === '/admin.html') {
    res.writeHead(301, { 'Location': '/admin' });
    res.end();
    return;
  }

  // Dedicated /admin route (only accessed via /admin)
  if (pathname === '/admin' || pathname === '/admin/') {
    const adminPath = path.join(__dirname, 'admin.html');
    fs.stat(adminPath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(adminPath).pipe(res);
    });
    return;
  }

  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`
  ==============================================================
   EcoPulse SmartBin OS Server Running!
   URL: http://localhost:${PORT}
   IoT API: http://localhost:${PORT}/api/bins
  ==============================================================
  `);
});
