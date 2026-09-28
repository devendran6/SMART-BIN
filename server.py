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
        if parsed.path == '/api/bins/update':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
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
