"""
PHPA Dashboard Telemetry Streaming Server (SSE + HTTP)
Author: Gagan Singh (ABES Engineering College)
GitHub: https://github.com/gagansingh0805
"""

import sys
import os
import json
import time
import urllib.parse
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler

# Ensure local imports work regardless of working directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simulation_engine import SimulationEngine

engine = SimulationEngine()

class TelemetryHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            return

        elif path == "/api/status":
            state = engine.step()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(state).encode("utf-8"))
            return

        elif path == "/api/stream":
            # Server-Sent Events (SSE) real-time streaming endpoint
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self._send_cors_headers()
            self.end_headers()

            try:
                while True:
                    state = engine.step()
                    payload = f"data: {json.dumps(state)}\n\n"
                    self.wfile.write(payload.encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(1.0)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return

        # Serve static built frontend files if requested
        frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
        req_file = path.lstrip("/")
        if not req_file or req_file == "":
            req_file = "index.html"
        file_path = os.path.join(frontend_dist, req_file)

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_response(200)
            if file_path.endswith(".html"):
                self.send_header("Content-Type", "text/html")
            elif file_path.endswith(".js"):
                self.send_header("Content-Type", "application/javascript")
            elif file_path.endswith(".css"):
                self.send_header("Content-Type", "text/css")
            self._send_cors_headers()
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b"{}"

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            payload = {}

        if path == "/api/control/play":
            engine.play()
            res = {"status": "playing"}
        elif path == "/api/control/pause":
            engine.pause()
            res = {"status": "paused"}
        elif path == "/api/control/speed":
            speed = payload.get("speed", 10.0)
            engine.set_speed(speed)
            res = {"status": "speed_updated", "speed": engine.speed_factor}
        elif path == "/api/control/spike":
            multiplier = payload.get("multiplier", 5.0)
            engine.inject_spike(multiplier=multiplier)
            res = {"status": "spike_injected", "multiplier": multiplier}
        elif path == "/api/control/traffic":
            mode = payload.get("mode", "auto")
            rps = payload.get("rps", 125.0)
            engine.set_traffic(mode=mode, rps=rps)
            res = {"status": "traffic_updated", "mode": engine.traffic_mode, "rps": engine.manual_rps}
        elif path == "/api/control/guardrails":
            min_pods = payload.get("minPods", 2)
            max_pods = payload.get("maxPods", 30)
            target_cpu = payload.get("targetCpu", 60.0)
            cooldown_sec = payload.get("cooldownSec", 60.0)
            engine.set_guardrails(min_pods, max_pods, target_cpu, cooldown_sec)
            res = {"status": "guardrails_updated"}
        elif path == "/api/control/reset":
            engine.reset()
            res = {"status": "reset"}
        else:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(res).encode("utf-8"))

    def log_message(self, format, *args):
        return

def run_server(port=8000):
    server = ThreadingHTTPServer(("0.0.0.0", port), TelemetryHandler)
    print(f"🚀 PHPA Telemetry & Control Server running at http://localhost:{port}", flush=True)
    print(f"   • Real-time SSE Stream: http://localhost:{port}/api/stream", flush=True)
    print(f"   • Health Check:         http://localhost:{port}/health", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    run_server()

