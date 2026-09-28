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
