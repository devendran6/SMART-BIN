/**
 * EcoPulse SmartBin OS - Admin Command Engine
 * Handles Municipal Fleet Operations, Route Optimization, and Hardware Diagnostics
 */

const CENTRAL_HUB = {
  id: "HUB-01",
  name: "Central Municipal Bio-Composting Plant",
  type: "facility",
  coords: [12.9716, 77.5946],
  description: "Main anaerobic digestion and pulp processing facility"
};

const INITIAL_STATIONS = {
  "BIN-101": {
    id: "BIN-101",
    name: "University Food Court & Cafeteria",
    zone: "Sector 1 &bull; Campus Area",
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
    zone: "Sector 3 &bull; IT Corridor",
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
    zone: "Sector 2 &bull; Commercial Zone",
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
    zone: "Sector 4 &bull; Eco Park",
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
    zone: "Sector 5 &bull; Health Quarter",
    coords: [12.9580, 77.5850],
    batteryPercent: 99,
    solarCharging: true,
    lastPing: "2 mins ago",
    compostable: { fillLevel: 25, weightKg: 5.4, temperatureC: 32.0, totalHeightCm: 100, maxCapacityLiters: 60 },
    decomposable: { fillLevel: 30, weightKg: 6.2, humidityPercent: 45, totalHeightCm: 100, maxCapacityLiters: 80 }
  }
};

class MunicipalAdminApp {
  constructor() {
    this.isAuthenticated = sessionStorage.getItem("ecopulse_admin_auth") === "true";
    this.state = this.loadState();
    this.map = null;
    this.stationMarkers = {};
    this.truckMarker = null;
    this.routePolyline = null;
    this.audioContext = null;
    this.iotTimer = null;

    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem("ecopulse_smartbin_role_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentStationId: parsed.currentStationId || "BIN-104",
          stations: { ...INITIAL_STATIONS, ...parsed.stations },
          iotSimulating: parsed.iotSimulating ?? true,
          audioAlertsEnabled: parsed.audioAlertsEnabled ?? true,
          pickupRouteActive: false,
          historyLogs: parsed.historyLogs || [],
          stats: parsed.stats || { totalPickups: 26, fuelSavedLiters: 48.6 }
        };
      }
    } catch (e) {
      console.warn("Could not load state, using defaults:", e);
    }

    return {
      currentStationId: "BIN-104",
      stations: JSON.parse(JSON.stringify(INITIAL_STATIONS)),
      iotSimulating: true,
      audioAlertsEnabled: true,
      pickupRouteActive: false,
      historyLogs: [],
      stats: { totalPickups: 26, fuelSavedLiters: 48.6 }
    };
  }

  saveState() {
    try {
      localStorage.setItem("ecopulse_smartbin_role_state", JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }

  getCurrentStation() {
    return this.state.stations[this.state.currentStationId] || this.state.stations["BIN-104"];
  }

  init() {
    // Ensure URL is cleanly normalized to /admin in browser address bar
    if (window.location.protocol.startsWith('http') && window.location.pathname.endsWith('/admin.html')) {
      window.history.replaceState(null, '', '/admin');
    }

    this.checkAuthUI();
    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderActiveStationDiagnostics();
    this.renderLogs();
    this.checkThresholdAlerts();
    this.setupEventListeners();
    this.initMap();

    if (this.state.iotSimulating) {
      this.startIotStream();
    }
  }

  checkAuthUI() {
    const authScreen = document.getElementById("admin-auth-screen");
    if (!authScreen) return;

    if (this.isAuthenticated) {
      authScreen.classList.add("hidden");
    } else {
      authScreen.classList.remove("hidden");
    }
  }

  login(username, password) {
    if ((username === "admin" || username === "officer") && (password === "admin123" || password === "admin")) {
      this.isAuthenticated = true;
      sessionStorage.setItem("ecopulse_admin_auth", "true");
      this.checkAuthUI();
      this.showToast("🛡️ Authentication Successful. Welcome, Officer!", "success");
    } else {
      alert("Invalid credentials. Try: admin / admin123");
    }
  }

  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem("ecopulse_admin_auth");
    this.checkAuthUI();
    this.showToast("🔒 Logged out of Municipal Admin Portal.", "info");
  }

  calculateDistance(fillPercentage, totalHeightCm = 100) {
    return Math.max(0, Math.round(totalHeightCm * (1 - fillPercentage / 100)));
  }

  renderStationSelector() {
    const container = document.getElementById("station-pills-container");
    if (!container) return;

    container.innerHTML = Object.values(this.state.stations).map(station => {
      const isCritical = station.compostable.fillLevel >= 80 || station.decomposable.fillLevel >= 80;
      const isActive = station.id === this.state.currentStationId;
      const criticalClass = isCritical ? "has-critical" : "";
      const activeClass = isActive ? "active" : "";

      let statusDot = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span>`;
      if (isCritical) {
        statusDot = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>`;
      } else if (station.compostable.fillLevel >= 60 || station.decomposable.fillLevel >= 60) {
        statusDot = `<span class="w-2 h-2 rounded-full bg-amber-400"></span>`;
      }

      return `
        <button onclick="window.adminApp.switchStation('${station.id}')" class="station-pill ${activeClass} ${criticalClass}">
          ${statusDot}
          <span>${station.id}: ${station.name.split("&")[0].trim()}</span>
          <span class="text-[10px] font-mono opacity-60">(${Math.max(station.compostable.fillLevel, station.decomposable.fillLevel)}%)</span>
        </button>
      `;
    }).join("");
  }

  renderFleetGrid() {
    const container = document.getElementById("fleet-overview-grid");
    if (!container) return;

    container.innerHTML = Object.values(this.state.stations).map(station => {
      const compFill = station.compostable.fillLevel;
      const decompFill = station.decomposable.fillLevel;
      const maxFill = Math.max(compFill, decompFill);
      const isCritical = maxFill >= 80;
      const isActive = station.id === this.state.currentStationId;

      let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      let statusText = "Normal";
      if (isCritical) {
        badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
        statusText = "Needs Pickup!";
      } else if (maxFill >= 60) {
        badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
        statusText = "Moderate";
      }

      return `
        <div onclick="window.adminApp.switchStation('${station.id}')" class="fleet-card ${isActive ? 'active-fleet' : ''}">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}"></span>
              ${station.id}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}">
              ${statusText}
            </span>
          </div>

          <h5 class="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">${station.name}</h5>
          <p class="text-[11px] text-slate-400 mb-3">${station.zone}</p>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div>
              <div class="flex justify-between text-slate-400 text-[10px]">
                <span>Compostable:</span>
                <span class="text-emerald-400 font-bold">${compFill}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all" style="width: ${compFill}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-slate-400 text-[10px]">
                <span>Decomposable:</span>
                <span class="text-amber-400 font-bold">${decompFill}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 transition-all" style="width: ${decompFill}%"></div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span class="flex items-center gap-1">
              <i data-lucide="battery-charging" class="w-3 h-3 text-emerald-400"></i> ${station.batteryPercent}%
            </span>
            <span class="text-sky-400 font-semibold hover:underline">Inspect &rarr;</span>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  switchStation(stationId) {
    if (!this.state.stations[stationId]) return;
    this.state.currentStationId = stationId;
    this.saveState();

    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderActiveStationDiagnostics();

    const station = this.getCurrentStation();
    if (this.map && station.coords) {
      this.map.flyTo(station.coords, 14, { animate: true, duration: 1 });
      if (this.stationMarkers[stationId]) {
        this.stationMarkers[stationId].openPopup();
      }
    }

    this.showToast(`🎯 Diagnostic Station set to ${station.id}`, "info");
  }

  renderActiveStationDiagnostics() {
    const station = this.getCurrentStation();

    const nameEl = document.getElementById("active-station-name");
    const zoneEl = document.getElementById("active-station-zone");
    const batteryEl = document.getElementById("active-station-battery");

    if (nameEl) nameEl.innerText = `${station.id}: ${station.name}`;
    if (zoneEl) zoneEl.innerHTML = station.zone;
    if (batteryEl) batteryEl.innerText = `${station.batteryPercent}%`;

    // Compostable
    const comp = station.compostable;
    const compFillEl = document.getElementById("compostable-percent");
    const compDistEl = document.getElementById("compostable-distance");
    const compWeightEl = document.getElementById("compostable-weight");
    const compTempEl = document.getElementById("compostable-temp");
    const compSlider = document.getElementById("slider-compostable");

    if (compFillEl) compFillEl.innerText = `${comp.fillLevel}%`;
    if (compDistEl) compDistEl.innerText = `${this.calculateDistance(comp.fillLevel)} cm`;
    if (compWeightEl) compWeightEl.innerText = `${comp.weightKg.toFixed(1)} kg`;
    if (compTempEl) compTempEl.innerText = `${comp.temperatureC || 38.5} °C`;
    if (compSlider) compSlider.value = comp.fillLevel;

    // Decomposable
    const decomp = station.decomposable;
    const decompFillEl = document.getElementById("decomposable-percent");
    const decompDistEl = document.getElementById("decomposable-distance");
    const decompWeightEl = document.getElementById("decomposable-weight");
    const decompHumEl = document.getElementById("decomposable-humidity");
    const decompSlider = document.getElementById("slider-decomposable");

    if (decompFillEl) decompFillEl.innerText = `${decomp.fillLevel}%`;
    if (decompDistEl) decompDistEl.innerText = `${this.calculateDistance(decomp.fillLevel)} cm`;
    if (decompWeightEl) decompWeightEl.innerText = `${decomp.weightKg.toFixed(1)} kg`;
    if (decompHumEl) decompHumEl.innerText = `${decomp.humidityPercent || 42}%`;
    if (decompSlider) decompSlider.value = decomp.fillLevel;
  }

  emptyBin(binKey) {
    const station = this.getCurrentStation();
    const bin = station[binKey];
    if (!bin) return;

    bin.fillLevel = 0;
    bin.weightKg = 0.5;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.historyLogs.unshift({
      time: timeStr,
      station: station.id,
      type: "empty",
      note: `[ADMIN FLUSH] Manual service reset on ${binKey} bin at ${station.id}`
    });

    this.saveState();
    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderActiveStationDiagnostics();
    this.renderLogs();
    this.updateMapMarker(station.id);
    this.checkThresholdAlerts();
    this.showToast(`✅ ${station.id} ${binKey.toUpperCase()} bin flushed to 0%`, "success");
  }

  checkThresholdAlerts() {
    const alertBanner = document.getElementById("critical-alert-banner");
    const alertText = document.getElementById("critical-alert-text");
    if (!alertBanner || !alertText) return;

    const criticalStations = Object.values(this.state.stations).filter(s => 
      s.compostable.fillLevel >= 80 || s.decomposable.fillLevel >= 80
    );

    if (criticalStations.length > 0) {
      alertBanner.classList.remove("hidden");
      const stationNames = criticalStations.map(s => `${s.id} (${Math.max(s.compostable.fillLevel, s.decomposable.fillLevel)}%)`).join(", ");
      alertText.innerText = `${criticalStations.length} Station(s) Exceeded Safe Capacity: ${stationNames} — Dispatch Recommended!`;
    } else {
      alertBanner.classList.add("hidden");
    }
  }

  exportTelemetryCSV() {
    let csv = "Station ID,Station Name,Zone,Compostable Fill (%),Decomposable Fill (%),Battery (%),Solar Charging\n";
    Object.values(this.state.stations).forEach(s => {
      csv += `"${s.id}","${s.name.replace(/"/g, '""')}","${s.zone.replace(/&bull;/g, '-')}",${s.compostable.fillLevel},${s.decomposable.fillLevel},${s.batteryPercent}%,"${s.solarCharging ? 'Yes' : 'No'}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EcoPulse_Fleet_Telemetry_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast("📄 Fleet telemetry CSV downloaded successfully!", "success");
  }

  // TSP Route Optimization
  optimizeAndDispatchRoute(mode = "auto") {
    if (this.state.pickupRouteActive) {
      this.showToast("🚚 Collection truck is currently on route! Use 'Recall Truck' to cancel.", "warning");
      return;
    }

    let stationsNeedingPickup = [];
    if (mode === "all") {
      stationsNeedingPickup = Object.values(this.state.stations);
      this.showToast(`🚛 Circuit Generated: Routing all ${stationsNeedingPickup.length} municipal stations`, "info");
    } else {
      stationsNeedingPickup = Object.values(this.state.stations).filter(s =>
        s.compostable.fillLevel >= 75 || s.decomposable.fillLevel >= 75
      );

      if (stationsNeedingPickup.length === 0) {
        // Fallback: Pick stations with active waste (>20%) or all stations for routine sweep
        stationsNeedingPickup = Object.values(this.state.stations).filter(s =>
          s.compostable.fillLevel > 20 || s.decomposable.fillLevel > 20
        );
        if (stationsNeedingPickup.length === 0) {
          stationsNeedingPickup = Object.values(this.state.stations);
        }
        this.showToast(`⚡ Routine Sweep: Routing ${stationsNeedingPickup.length} stations with active waste`, "info");
      } else {
        this.showToast(`🚨 Priority Route: Visiting ${stationsNeedingPickup.length} full stations (≥75%)`, "warning");
      }
    }

    this.state.pickupRouteActive = true;

    const routeWaypoints = [CENTRAL_HUB];
    let unvisited = [...stationsNeedingPickup];
    let currentPoint = CENTRAL_HUB.coords;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = this.getHaversineDistance(currentPoint, unvisited[i].coords);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStation = unvisited.splice(nearestIdx, 1)[0];
      routeWaypoints.push(nextStation);
      currentPoint = nextStation.coords;
    }

    routeWaypoints.push(CENTRAL_HUB);

    this.renderRouteManifest(routeWaypoints);

    const latLngs = routeWaypoints.map(w => w.coords);
    if (this.routePolyline && this.map) {
      this.map.removeLayer(this.routePolyline);
    }

    if (this.map) {
      this.map.invalidateSize();
      this.routePolyline = L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(this.map);

      try {
        this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }

    this.traverseTruckRoute(routeWaypoints);
  }

  // Direct dispatch to a single target station
  dispatchDirectToStation(stationId) {
    if (this.state.pickupRouteActive) {
      this.showToast("🚚 Collection truck is currently on route! Use 'Recall Truck' to cancel.", "warning");
      return;
    }
    const station = this.state.stations[stationId];
    if (!station) return;

    this.state.pickupRouteActive = true;
    const routeWaypoints = [CENTRAL_HUB, station, CENTRAL_HUB];
    this.renderRouteManifest(routeWaypoints);

    const latLngs = routeWaypoints.map(w => w.coords);
    if (this.routePolyline && this.map) {
      this.map.removeLayer(this.routePolyline);
    }

    if (this.map) {
      this.map.invalidateSize();
      this.routePolyline = L.polyline(latLngs, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
        dashArray: '6, 6'
      }).addTo(this.map);

      try {
        this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }

    this.showToast(`🚛 Direct Dispatch: Heading to ${station.name} (${station.id})`, "info");
    this.traverseTruckRoute(routeWaypoints);
  }

  // Cancel running truck route and recall to depot
  cancelPickupRoute() {
    if (this.truckMoveTimer) {
      clearInterval(this.truckMoveTimer);
      this.truckMoveTimer = null;
    }
    if (this.truckStepTimeout) {
      clearTimeout(this.truckStepTimeout);
      this.truckStepTimeout = null;
    }

    this.state.pickupRouteActive = false;

    if (this.routePolyline && this.map) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    if (this.truckMarker) {
      this.truckMarker.setLatLng(CENTRAL_HUB.coords);
    }

    const container = document.getElementById("driver-route-manifest");
    if (container) {
      container.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
          <i data-lucide="compass" class="w-6 h-6 mx-auto mb-2 opacity-50 text-sky-400"></i>
          Route canceled. Truck is standing by at Central Bio-Plant Depot. Click <strong>"Run TSP Route"</strong> to dispatch.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    this.showToast("🛑 Route canceled. Truck recalled to Central Depot.", "info");
  }

  // Trigger high fill levels for testing
  simulateCriticalFillLevels() {
    if (!this.state.stations["BIN-101"]) return;
    this.state.stations["BIN-101"].compostable.fillLevel = 92;
    this.state.stations["BIN-101"].compostable.weightKg = 24.5;
    this.state.stations["BIN-102"].decomposable.fillLevel = 86;
    this.state.stations["BIN-102"].decomposable.weightKg = 20.2;
    this.state.stations["BIN-104"].compostable.fillLevel = 81;
    this.state.stations["BIN-104"].compostable.weightKg = 19.8;
    this.saveState();
    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderActiveStationDiagnostics();
    this.checkThresholdAlerts();
    Object.values(this.state.stations).forEach(s => this.createOrUpdateStationMarker(s));
    this.showToast("🚨 Critical overflow triggered on BIN-101, BIN-102 & BIN-104! Test TSP route now.", "warning");
  }

  getHaversineDistance(coords1, coords2) {
    const R = 6371;
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLng = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  renderRouteManifest(waypoints) {
    const container = document.getElementById("driver-route-manifest");
    if (!container) return;

    if (!waypoints || waypoints.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
          <i data-lucide="compass" class="w-6 h-6 mx-auto mb-2 opacity-50 text-sky-400"></i>
          Click <strong>"Run TSP Route"</strong> to generate shortest fuel-saving path connecting full bins!
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let totalDistKm = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistKm += this.getHaversineDistance(waypoints[i].coords, waypoints[i + 1].coords);
    }

    const fuelSaved = (totalDistKm * 0.42).toFixed(1);

    container.innerHTML = `
      <div class="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/60 mb-3 space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-sky-300">
          <span class="flex items-center gap-1.5"><i data-lucide="navigation" class="w-4 h-4"></i> Optimal TSP Path Active</span>
          <span class="font-mono">${totalDistKm.toFixed(1)} km Total</span>
        </div>
        <div class="text-[11px] text-slate-300 flex items-center justify-between">
          <span>Stops: <strong>${Math.max(0, waypoints.length - 2)} Pickups</strong></span>
          <span class="text-emerald-400 font-semibold">Fuel Saved: ~${fuelSaved} L diesel</span>
        </div>
      </div>

      <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        ${waypoints.map((wp, idx) => {
          const isStartOrEnd = wp.id === "HUB-01";
          return `
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
              <span class="waypoint-badge">#${idx + 1}</span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-200 truncate">${wp.name}</div>
                <div class="text-[10px] text-slate-400 font-mono">${isStartOrEnd ? 'Processing Central Hub' : wp.id + ' Pick Up'}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  traverseTruckRoute(waypoints) {
    let currentIdx = 0;

    const visitNextWaypoint = () => {
      if (currentIdx >= waypoints.length - 1) {
        this.state.pickupRouteActive = false;
        this.truckMoveTimer = null;
        this.truckStepTimeout = null;
        this.saveState();
        this.showToast("🎉 Route Complete: All critical stations emptied & processed at Bio-Plant!", "success");
        if (this.routePolyline && this.map) {
          this.map.removeLayer(this.routePolyline);
          this.routePolyline = null;
        }
        return;
      }

      const fromPoint = waypoints[currentIdx].coords;
      const toPoint = waypoints[currentIdx + 1].coords;
      const nextTarget = waypoints[currentIdx + 1];

      let progress = 0;
      const steps = 12;

      this.truckMoveTimer = setInterval(() => {
        progress++;
        const lat = fromPoint[0] + (toPoint[0] - fromPoint[0]) * (progress / steps);
        const lng = fromPoint[1] + (toPoint[1] - fromPoint[1]) * (progress / steps);

        if (this.truckMarker) {
          this.truckMarker.setLatLng([lat, lng]);
        }

        if (progress >= steps) {
          clearInterval(this.truckMoveTimer);
          this.truckMoveTimer = null;
          currentIdx++;

          if (nextTarget.id !== "HUB-01") {
            const station = this.state.stations[nextTarget.id];
            if (station) {
              const collected = (station.compostable.weightKg + station.decomposable.weightKg).toFixed(1);
              station.compostable.fillLevel = 0;
              station.compostable.weightKg = 0.5;
              station.decomposable.fillLevel = 0;
              station.decomposable.weightKg = 0.5;

              this.saveState();
              this.updateMapMarker(station.id);
              this.renderStationSelector();
              this.renderFleetGrid();
              this.renderActiveStationDiagnostics();

              this.showToast(`🚛 Cleared & Sanitized: ${station.name} (${collected} kg)`, "info");
            }
          }

          this.truckStepTimeout = setTimeout(visitNextWaypoint, 1200);
        }
      }, 150);
    };

    visitNextWaypoint();
  }

  initMap() {
    const mapEl = document.getElementById("smartbin-map");
    if (!mapEl) return;

    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
      return;
    }

    if (!window.L) {
      console.warn("Leaflet library loading, retrying in 250ms...");
      setTimeout(() => this.initMap(), 250);
      return;
    }

    try {
      this.map = L.map("smartbin-map", {
        zoomControl: true,
        attributionControl: false
      }).setView(CENTRAL_HUB.coords, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(this.map);

      const hubIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px #3b82f6; border: 2.5px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker(CENTRAL_HUB.coords, { icon: hubIcon }).addTo(this.map).bindPopup(`
        <div style="font-family: var(--font-main); padding: 4px;">
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #38bdf8;">Municipal Bio-Compost Facility</h4>
          <p style="font-size: 11px; margin: 0; color: #cbd5e1;">Central processing plant & fleet depot</p>
        </div>
      `);

      this.truckMarker = L.marker(CENTRAL_HUB.coords, {
        icon: L.divIcon({
          className: 'truck-map-icon',
          html: `
            <div style="background: #f59e0b; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #f59e0b; border: 2.5px solid white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(this.map);

      Object.values(this.state.stations).forEach(station => {
        this.createOrUpdateStationMarker(station);
      });

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 250);
    } catch (err) {
      console.error("Map initialization error:", err);
      setTimeout(() => this.initMap(), 500);
    }
  }

  createOrUpdateStationMarker(station) {
    const maxFill = Math.max(station.compostable.fillLevel, station.decomposable.fillLevel);
    let markerHtml = `<div class="pulse-marker-normal"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></div>`;

    if (maxFill >= 80) {
      markerHtml = `<div class="pulse-marker-critical"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`;
    } else if (maxFill >= 60) {
      markerHtml = `<div class="pulse-marker-warning"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></div>`;
    }

    const icon = L.divIcon({
      className: 'station-map-marker',
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (this.stationMarkers[station.id]) {
      this.stationMarkers[station.id].setIcon(icon);
    } else {
      const marker = L.marker(station.coords, { icon: icon }).addTo(this.map);
      marker.bindPopup(`
        <div style="font-family: var(--font-main); padding: 4px;">
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #38bdf8;">${station.id}: ${station.name}</h4>
          <p style="font-size: 11px; margin: 0 0 6px 0; color: #cbd5e1;">Compostable: <strong>${station.compostable.fillLevel}%</strong> | Decomposable: <strong>${station.decomposable.fillLevel}%</strong></p>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button onclick="window.adminApp.switchStation('${station.id}')" style="background: #3b82f6; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
              Load Diagnostics
            </button>
            <button onclick="window.adminApp.dispatchDirectToStation('${station.id}')" style="background: #f43f5e; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
              🚛 Dispatch Truck
            </button>
          </div>
        </div>
      `);
      this.stationMarkers[station.id] = marker;
    }
  }

  updateMapMarker(stationId) {
    const station = this.state.stations[stationId];
    if (station && this.map) {
      this.createOrUpdateStationMarker(station);
    }
  }

  renderLogs() {
    const container = document.getElementById("activity-logs-container");
    if (!container) return;

    if (this.state.historyLogs.length === 0) {
      container.innerHTML = `<div class="text-sm text-slate-500 text-center py-4">No recent activity logged.</div>`;
      return;
    }

    container.innerHTML = this.state.historyLogs.slice(0, 6).map(log => {
      let iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      let icon = "arrow-down-circle";
      if (log.type === "empty") {
        iconColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
        icon = "refresh-cw";
      } else if (log.type === "alert") {
        iconColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
        icon = "alert-circle";
      }

      return `
        <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 transition-all">
          <div class="p-2 rounded-lg border ${iconColor} flex-shrink-0">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-slate-200">${log.station || 'Station'}</span>
              <span class="text-[10px] font-mono text-slate-400">${log.time}</span>
            </div>
            <p class="text-xs text-slate-400 truncate mt-0.5">${log.note}</p>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  startIotStream() {
    if (this.iotTimer) clearInterval(this.iotTimer);

    this.iotTimer = setInterval(() => {
      if (!this.state.iotSimulating) return;

      const stationKeys = Object.keys(this.state.stations);
      const randomStationId = stationKeys[Math.floor(Math.random() * stationKeys.length)];
      const station = this.state.stations[randomStationId];

      const binKey = Math.random() > 0.5 ? "compostable" : "decomposable";
      const bin = station[binKey];

      if (bin.fillLevel < 95) {
        const delta = Math.floor(Math.random() * 2) + 1;
        bin.fillLevel = Math.min(100, bin.fillLevel + delta);
        bin.weightKg = parseFloat((bin.weightKg + delta * 0.25).toFixed(1));

        if (station.id === this.state.currentStationId) {
          this.renderActiveStationDiagnostics();
        }

        this.updateMapMarker(station.id);
        this.renderStationSelector();
        this.renderFleetGrid();
        this.checkThresholdAlerts();
      }
    }, 4500);
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    let borderColor = "border-sky-500/50 bg-slate-900/90 text-sky-300";
    if (type === "warning") borderColor = "border-amber-500/50 bg-slate-900/90 text-amber-300";
    if (type === "danger") borderColor = "border-rose-500/50 bg-slate-900/90 text-rose-300";
    if (type === "success") borderColor = "border-emerald-500/50 bg-slate-900/90 text-emerald-300";

    toast.className = `px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${borderColor}`;
    toast.innerHTML = message;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-y-2", "opacity-0"));

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  setupEventListeners() {
    const loginForm = document.getElementById("admin-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const u = document.getElementById("admin-username")?.value;
        const p = document.getElementById("admin-password")?.value;
        this.login(u, p);
      });
    }

    const logoutBtn = document.getElementById("admin-logout-btn");
    const logoutBtnFooter = document.getElementById("admin-logout-btn-footer");
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());
    if (logoutBtnFooter) logoutBtnFooter.addEventListener("click", () => this.logout());

    document.querySelectorAll("[data-empty-bin]").forEach(btn => {
      btn.addEventListener("click", () => {
        const bin = btn.dataset.emptyBin;
        this.emptyBin(bin);
      });
    });

    const compSlider = document.getElementById("slider-compostable");
    if (compSlider) {
      compSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        this.getCurrentStation().compostable.fillLevel = val;
        this.renderActiveStationDiagnostics();
        this.renderFleetGrid();
        this.updateMapMarker(this.state.currentStationId);
        this.saveState();
      });
    }

    const decompSlider = document.getElementById("slider-decomposable");
    if (decompSlider) {
      decompSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        this.getCurrentStation().decomposable.fillLevel = val;
        this.renderActiveStationDiagnostics();
        this.renderFleetGrid();
        this.updateMapMarker(this.state.currentStationId);
        this.saveState();
      });
    }

    const exportCsvBtn = document.getElementById("export-csv-btn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportTelemetryCSV());
    }

    const toggleIotBtn = document.getElementById("toggle-iot-btn");
    if (toggleIotBtn) {
      toggleIotBtn.addEventListener("click", () => {
        this.state.iotSimulating = !this.state.iotSimulating;
        const ind = document.getElementById("iot-live-indicator");
        if (ind) ind.classList.toggle("opacity-40", !this.state.iotSimulating);
        this.showToast(this.state.iotSimulating ? "⚡ IoT Live Feed Active" : "⏸️ IoT Live Feed Paused", "info");
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.adminApp = new MunicipalAdminApp();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
