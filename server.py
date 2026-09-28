"""
EcoPulse SmartBin OS - Python Local HTTP & REST Server
Zero external dependencies, runs with native Python 3 standard library
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

import math

PORT = 3000

bin_state = {
    "binId": "BIN-104",
    "location": "Green Civic Hub, Sector 4",
    "compostable": {
        "name": "Compostable Waste (Wet Organic)",
        "fillPercent": 68,
        "distanceCm": 32,
        "weightKg": 16.8,
        "temperatureC": 38.5,
        "maxCapacityL": 60,
        "status": "Optimal"
    },
    "decomposable": {
        "name": "Decomposable Waste (Dry Fibers)",
        "fillPercent": 42,
        "distanceCm": 58,
        "weightKg": 9.4,
        "humidityPercent": 44,
        "maxCapacityL": 80,
        "status": "Optimal"
    },
    "lastUpdated": datetime.now().isoformat()
}

CENTRAL_HUB = {
    "id": "HUB-01",
    "name": "Central Municipal Bio-Composting Plant",
    "type": "facility",
    "coords": [12.9716, 77.5946],
    "description": "Main anaerobic digestion and pulp processing facility"
}

stations_state = {
    "BIN-101": {
        "id": "BIN-101",
        "name": "University Food Court & Cafeteria",
        "zone": "Sector 1 • Campus Area",
        "coords": [12.9820, 77.5880],
        "batteryPercent": 94,
        "solarCharging": True,
        "lastPing": "Just now",
        "compostable": {"fillLevel": 88, "weightKg": 22.4, "temperatureC": 41.2, "totalHeightCm": 100, "maxCapacityLiters": 60},
        "decomposable": {"fillLevel": 42, "weightKg": 8.6, "humidityPercent": 40, "totalHeightCm": 100, "maxCapacityLiters": 80}
    },
    "BIN-102": {
        "id": "BIN-102",
        "name": "Tech Park & Corporate Plaza",
        "zone": "Sector 3 • IT Corridor",
        "coords": [12.9640, 77.6110],
        "batteryPercent": 98,
        "solarCharging": True,
        "lastPing": "1 min ago",
        "compostable": {"fillLevel": 32, "weightKg": 7.8, "temperatureC": 34.0, "totalHeightCm": 100, "maxCapacityLiters": 60},
        "decomposable": {"fillLevel": 84, "weightKg": 19.5, "humidityPercent": 38, "totalHeightCm": 100, "maxCapacityLiters": 80}
    },
    "BIN-103": {
        "id": "BIN-103",
        "name": "Metro Transit & City Plaza",
        "zone": "Sector 2 • Commercial Zone",
        "coords": [12.9910, 77.6080],
        "batteryPercent": 91,
        "solarCharging": False,
        "lastPing": "Just now",
        "compostable": {"fillLevel": 56, "weightKg": 13.8, "temperatureC": 37.0, "totalHeightCm": 100, "maxCapacityLiters": 60},
        "decomposable": {"fillLevel": 64, "weightKg": 14.2, "humidityPercent": 42, "totalHeightCm": 100, "maxCapacityLiters": 80}
    },
    "BIN-104": {
        "id": "BIN-104",
        "name": "Green Civic Hub & Botanical Garden",
        "zone": "Sector 4 • Eco Park",
        "coords": [12.9850, 77.6100],
        "batteryPercent": 96,
        "solarCharging": True,
        "lastPing": "Just now",
        "compostable": {"fillLevel": 68, "weightKg": 16.8, "temperatureC": 38.5, "totalHeightCm": 100, "maxCapacityLiters": 60},
        "decomposable": {"fillLevel": 42, "weightKg": 9.4, "humidityPercent": 44, "totalHeightCm": 100, "maxCapacityLiters": 80}
    },
    "BIN-105": {
        "id": "BIN-105",
        "name": "City General Hospital & Medical Zone",
        "zone": "Sector 5 • Health Quarter",
        "coords": [12.9580, 77.5850],
        "batteryPercent": 99,
        "solarCharging": True,
        "lastPing": "2 mins ago",
        "compostable": {"fillLevel": 25, "weightKg": 5.4, "temperatureC": 32.0, "totalHeightCm": 100, "maxCapacityLiters": 60},
        "decomposable": {"fillLevel": 30, "weightKg": 6.2, "humidityPercent": 45, "totalHeightCm": 100, "maxCapacityLiters": 80}
    }
}

reports_state = []

def get_haversine_distance(coords1, coords2):
    R = 6371
    d_lat = (coords2[0] - coords1[0]) * math.pi / 180
    d_lng = (coords2[1] - coords1[1]) * math.pi / 180
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(coords1[0] * math.pi / 180) * math.cos(coords2[0] * math.pi / 180) *
         math.sin(d_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_optimal_route(target_stations=None):
    if not target_stations:
        target_stations = [s for s in stations_state.values() if s["compostable"]["fillLevel"] >= 75 or s["decomposable"]["fillLevel"] >= 75]
    if not target_stations:
        target_stations = list(stations_state.values())
        
    waypoints = [CENTRAL_HUB]
    unvisited = list(target_stations)
    current_point = CENTRAL_HUB["coords"]

    while unvisited:
        nearest_idx = 0
        min_dist = float('inf')
        for i, station in enumerate(unvisited):
            d = get_haversine_distance(current_point, station["coords"])
            if d < min_dist:
                min_dist = d
                nearest_idx = i
        next_station = unvisited.pop(nearest_idx)
        waypoints.append(next_station)
        current_point = next_station["coords"]

    waypoints.append(CENTRAL_HUB)

    total_dist = 0.0
    for i in range(len(waypoints) - 1):
        total_dist += get_haversine_distance(waypoints[i]["coords"], waypoints[i + 1]["coords"])

    fuel_saved = round(total_dist * 0.42, 1)

    return {
        "waypoints": waypoints,
        "totalDistanceKm": round(total_dist, 2),
        "stopsCount": len(waypoints) - 2,
        "fuelSavedLiters": fuel_saved,
        "generatedAt": datetime.now().isoformat()
    }

class SmartBinRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/bins':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(bin_state, indent=2).encode('utf-8'))
            return

        if parsed.path == '/api/stations':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {"hub": CENTRAL_HUB, "stations": stations_state, "totalCount": len(stations_state)}
            self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
            return

        if parsed.path in ['/api/routes', '/api/routes/optimize', '/api/route']:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            result = calculate_optimal_route()
            self.wfile.write(json.dumps({"success": True, "route": result}, indent=2).encode('utf-8'))
            return

        if parsed.path == '/api/reports':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"reports": reports_state, "total": len(reports_state)}, indent=2).encode('utf-8'))
            return
        
        # Redirect direct .html requests to /admin
        if parsed.path == '/admin.html':
            self.send_response(301)
            self.send_header('Location', '/admin')
            self.end_headers()
            return

        # Dedicated /admin route (only accessed via /admin)
        if parsed.path in ['/admin', '/admin/']:
            self.path = '/admin.html'

        # Fall back to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        if parsed.path == '/api/bins/update':
            try:
                payload = json.loads(body.decode('utf-8'))
                if 'compostable' in payload:
                    bin_state['compostable'].update(payload['compostable'])
                if 'decomposable' in payload:
                    bin_state['decomposable'].update(payload['decomposable'])
                bin_state['lastUpdated'] = datetime.now().isoformat()
                
                print(f"[IoT INGEST] Updated: Comp={bin_state['compostable']['fillPercent']}%, Decomp={bin_state['decomposable']['fillPercent']}%")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": True, "state": bin_state}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if parsed.path == '/api/stations/update':
            try:
                payload = json.loads(body.decode('utf-8'))
                s_id = payload.get('stationId') or payload.get('id')
                if s_id and s_id in stations_state:
                    if 'compostable' in payload:
                        stations_state[s_id]['compostable'].update(payload['compostable'])
                    if 'decomposable' in payload:
                        stations_state[s_id]['decomposable'].update(payload['decomposable'])
                    if 'batteryPercent' in payload:
                        stations_state[s_id]['batteryPercent'] = payload['batteryPercent']
                    stations_state[s_id]['lastPing'] = "Just now"
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "station": stations_state[s_id]}).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Station not found"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if parsed.path in ['/api/routes', '/api/routes/optimize', '/api/route']:
            try:
                payload = json.loads(body.decode('utf-8')) if body else {}
                target = payload.get('stations')
                result = calculate_optimal_route(target)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "route": result}).encode('utf-8'))
            except Exception as e:
                result = calculate_optimal_route()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "route": result}).encode('utf-8'))
            return

        if parsed.path == '/api/reports':
            try:
                payload = json.loads(body.decode('utf-8'))
                new_rep = {
                    "id": f"REP-{int(datetime.now().timestamp()) % 10000}",
                    "stationId": payload.get("stationId", "BIN-104"),
                    "issueType": payload.get("issueType", "Overflow"),
                    "notes": payload.get("notes", ""),
                    "timestamp": datetime.now().isoformat(),
                    "status": "Pending Dispatch"
                }
                reports_state.insert(0, new_rep)
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "report": new_rep}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), SmartBinRequestHandler) as httpd:
        print(f"""
  ==============================================================
   EcoPulse SmartBin OS Python Server Running!
   URL: http://localhost:{PORT}
   IoT API: http://localhost:{PORT}/api/bins
  ==============================================================
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
