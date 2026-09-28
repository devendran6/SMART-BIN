/**
 * EcoPulse SmartBin OS - Multi-Location Fleet & Role Engine
 * Dual Portals: Citizen User View & Municipal Admin View
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
    distanceMeters: 450,
    coords: [12.9820, 77.5880],
    batteryPercent: 94,
    solarCharging: true,
    lastPing: "Just now",
    compostable: {
      fillLevel: 88,
      weightKg: 22.4,
      temperatureC: 41.2,
      moisturePercent: 70,
      totalHeightCm: 100,
      maxCapacityLiters: 60,
      lidOpen: false
    },
    decomposable: {
      fillLevel: 42,
      weightKg: 8.6,
      humidityPercent: 40,
      totalHeightCm: 100,
      maxCapacityLiters: 80,
      lidOpen: false
    }
  },
  "BIN-102": {
    id: "BIN-102",
    name: "Tech Park & Corporate Plaza",
    zone: "Sector 3 &bull; IT Corridor",
    distanceMeters: 850,
    coords: [12.9640, 77.6110],
    batteryPercent: 98,
    solarCharging: true,
    lastPing: "1 min ago",
    compostable: {
      fillLevel: 32,
      weightKg: 7.8,
      temperatureC: 34.0,
      moisturePercent: 55,
      totalHeightCm: 100,
      maxCapacityLiters: 60,
      lidOpen: false
    },
    decomposable: {
      fillLevel: 84,
      weightKg: 19.5,
      humidityPercent: 38,
      totalHeightCm: 100,
      maxCapacityLiters: 80,
      lidOpen: false
    }
  },
  "BIN-103": {
    id: "BIN-103",
    name: "Metro Transit & City Plaza",
    zone: "Sector 2 &bull; Commercial Zone",
    distanceMeters: 620,
    coords: [12.9910, 77.6080],
    batteryPercent: 91,
    solarCharging: false,
    lastPing: "Just now",
    compostable: {
      fillLevel: 56,
      weightKg: 13.8,
      temperatureC: 37.0,
      moisturePercent: 62,
      totalHeightCm: 100,
      maxCapacityLiters: 60,
      lidOpen: false
    },
    decomposable: {
      fillLevel: 64,
      weightKg: 14.2,
      humidityPercent: 42,
      totalHeightCm: 100,
      maxCapacityLiters: 80,
      lidOpen: false
    }
  },
  "BIN-104": {
    id: "BIN-104",
    name: "Green Civic Hub & Botanical Garden",
    zone: "Sector 4 &bull; Eco Park",
    distanceMeters: 120,
    coords: [12.9850, 77.6100],
    batteryPercent: 96,
    solarCharging: true,
    lastPing: "Just now",
    compostable: {
      fillLevel: 68,
      weightKg: 16.8,
      temperatureC: 38.5,
      moisturePercent: 65,
      totalHeightCm: 100,
      maxCapacityLiters: 60,
      lidOpen: false
    },
    decomposable: {
      fillLevel: 42,
      weightKg: 9.4,
      humidityPercent: 44,
      totalHeightCm: 100,
      maxCapacityLiters: 80,
      lidOpen: false
    }
  },
  "BIN-105": {
    id: "BIN-105",
    name: "City General Hospital & Medical Zone",
    zone: "Sector 5 &bull; Health Quarter",
    distanceMeters: 980,
    coords: [12.9580, 77.5850],
    batteryPercent: 99,
    solarCharging: true,
    lastPing: "2 mins ago",
    compostable: {
      fillLevel: 25,
      weightKg: 5.4,
      temperatureC: 32.0,
      moisturePercent: 50,
      totalHeightCm: 100,
      maxCapacityLiters: 60,
      lidOpen: false
    },
    decomposable: {
      fillLevel: 30,
      weightKg: 6.2,
      humidityPercent: 45,
      totalHeightCm: 100,
      maxCapacityLiters: 80,
      lidOpen: false
    }
  }
};

const WASTE_DATABASE = [
  { name: "Banana Peel", category: "compostable", icon: "🍌", time: "2 - 4 Weeks", tip: "Chop into smaller pieces to accelerate microbial breakdown." },
  { name: "Apple Core", category: "compostable", icon: "🍎", time: "1 - 2 Months", tip: "Rich in nitrogen and moisture, ideal for aerobic composting." },
  { name: "Coffee Grounds & Filter", category: "compostable", icon: "☕", time: "2 - 3 Months", tip: "Unbleached paper filters decompose along with coffee grounds." },
  { name: "Egg Shells", category: "compostable", icon: "🥚", time: "6 - 12 Months", tip: "Crush finely to provide rich calcium carbonate to compost." },
  { name: "Vegetable Trimmings", category: "compostable", icon: "🥗", time: "2 - 4 Weeks", tip: "Perfect 'green' nitrogen source for balanced composting." },
  { name: "Fallen Leaves & Twigs", category: "compostable", icon: "🍂", time: "3 - 6 Months", tip: "Great 'brown' carbon source to prevent bin odor." },
  
  { name: "Cardboard Box (Clean)", category: "decomposable", icon: "📦", time: "2 Months", tip: "Remove plastic packing tape and flatten to maximize bin space." },
  { name: "Brown Paper Grocery Bag", category: "decomposable", icon: "🛍️", time: "1 Month", tip: "Untreated kraft paper degrades naturally within weeks." },
  { name: "Egg Carton (Paper pulp)", category: "decomposable", icon: "🥡", time: "1 - 2 Months", tip: "Pulp fibers decompose rapidly and absorb excess moisture." },
  { name: "Newspaper / Newsprint", category: "decomposable", icon: "📰", time: "6 Weeks", tip: "Soy-based inks are completely biodegradable." },
  { name: "Untreated Wood Shavings", category: "decomposable", icon: "🪵", time: "6 - 12 Months", tip: "Natural untreated wood fibers decompose naturally into humus." },

  { name: "Plastic Bottle (PET)", category: "non-decomposable", icon: "🧴", time: "450 Years", tip: "DO NOT PUT IN THESE BINS. Divert to Plastic Recycling Stream!" },
  { name: "Styrofoam Cup", category: "non-decomposable", icon: "☕", time: "500+ Years", tip: "Does not decompose naturally. Requires specialized chemical recycling." },
  { name: "Aluminum Soda Can", category: "non-decomposable", icon: "🥫", time: "200 Years", tip: "Place in Clean Metal Scrap / Dry Recycling Bin." }
];

class SmartBinApp {
  constructor() {
    this.state = this.loadState();
    this.audioContext = null;
    this.iotTimer = null;
    this.map = null;
    this.stationMarkers = {};
    this.truckMarker = null;
    this.routePolyline = null;
    this.charts = {};

    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem("ecopulse_smartbin_role_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentRole: parsed.currentRole || "citizen", // "citizen" or "admin"
          currentStationId: parsed.currentStationId || "BIN-104",
          activeModel: parsed.activeModel || "model-smart-kiosk",
          citizenPoints: parsed.citizenPoints || 140,
          citizenRank: parsed.citizenRank || "Eco-Champion",
          stations: { ...INITIAL_STATIONS, ...parsed.stations },
          iotSimulating: parsed.iotSimulating ?? true,
          audioAlertsEnabled: parsed.audioAlertsEnabled ?? true,
          pickupRouteActive: false,
          historyLogs: parsed.historyLogs || [
            { time: "18:45:10", station: "BIN-101", type: "alert", note: "Compostable bin exceeded 85% capacity" },
            { time: "17:20:04", station: "BIN-102", type: "alert", note: "Decomposable packaging reached 84%" },
            { time: "15:05:32", station: "BIN-104", type: "deposit", note: "Citizen earned +10 Eco-Points for organic disposal" }
          ],
          stats: parsed.stats || {
            totalCompostProducedKg: 284.5,
            co2EmissionsSavedKg: 142.0,
            landfillDivertedKg: 512.0,
            totalPickups: 26,
            fuelSavedLiters: 48.6
          }
        };
      }
    } catch (e) {
      console.warn("Could not load state, using defaults:", e);
    }

    return {
      currentRole: "citizen",
      currentStationId: "BIN-104",
      activeModel: "model-smart-kiosk",
      citizenPoints: 140,
      citizenRank: "Eco-Champion",
      stations: JSON.parse(JSON.stringify(INITIAL_STATIONS)),
      iotSimulating: true,
      audioAlertsEnabled: true,
      pickupRouteActive: false,
      historyLogs: [
        { time: "18:45:10", station: "BIN-101", type: "alert", note: "Compostable bin exceeded 85% capacity" },
        { time: "17:20:04", station: "BIN-102", type: "alert", note: "Decomposable packaging reached 84%" },
        { time: "15:05:32", station: "BIN-104", type: "deposit", note: "Citizen earned +10 Eco-Points for organic disposal" }
      ],
      stats: {
        totalCompostProducedKg: 284.5,
        co2EmissionsSavedKg: 142.0,
        landfillDivertedKg: 512.0,
        totalPickups: 26,
        fuelSavedLiters: 48.6
      }
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
    this.applyRole(this.state.currentRole);
    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderAll();
    this.setupEventListeners();
    this.initCharts();
    this.initMap();

    if (this.state.iotSimulating) {
      this.startIotStream();
    }
  }

  // =========================================================================
  // ROLE SWITCHING: CITIZEN USER vs MUNICIPAL ADMIN
  // =========================================================================

  applyRole(role) {
    this.state.currentRole = role;
    document.body.classList.remove("mode-citizen", "mode-admin");
    document.body.classList.add(role === "admin" ? "mode-admin" : "mode-citizen");

    // Update buttons in switcher
    const citizenBtn = document.getElementById("role-btn-citizen");
    const adminBtn = document.getElementById("role-btn-admin");
    const portalTag = document.getElementById("portal-badge-tag");

    if (citizenBtn && adminBtn) {
      if (role === "admin") {
        adminBtn.className = "role-switch-btn active-admin";
        citizenBtn.className = "role-switch-btn";
        if (portalTag) {
          portalTag.innerText = "MUNICIPAL ADMIN & FLEET COMMAND";
          portalTag.className = "text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold";
        }
        this.showToast("🛡️ Switched to Municipal Admin & Fleet Operations Mode", "info");
      } else {
        citizenBtn.className = "role-switch-btn active-citizen";
        adminBtn.className = "role-switch-btn";
        if (portalTag) {
          portalTag.innerText = "CITIZEN ECO-PORTAL";
          portalTag.className = "text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
        }
        this.showToast("👤 Switched to Citizen / Public User Mode", "info");
      }
    }

    this.saveState();
  }

  // Citizen adds Eco-Points on disposal
  addCitizenPoints(pts = 10) {
    this.state.citizenPoints += pts;
    if (this.state.citizenPoints >= 300) {
      this.state.citizenRank = "Eco-Guardian 🌟";
    } else if (this.state.citizenPoints >= 150) {
      this.state.citizenRank = "Eco-Champion 🌿";
    }

    const ptsEl = document.getElementById("citizen-points-counter");
    const rankEl = document.getElementById("citizen-rank-label");
    if (ptsEl) ptsEl.innerText = `${this.state.citizenPoints} Pts`;
    if (rankEl) rankEl.innerText = this.state.citizenRank;

    this.saveState();
  }

  // Citizen Issue Reporting
  submitCitizenReport(issueType, issueText) {
    const station = this.getCurrentStation();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.state.historyLogs.unshift({
      time: timeStr,
      station: station.id,
      type: "alert",
      note: `[CITIZEN REPORT] ${issueType}: ${issueText}`
    });

    this.saveState();
    this.renderLogs();
    this.showToast(`🚨 Report submitted for ${station.id}. Municipal team alerted!`, "warning");
    
    // Close modal
    const modal = document.getElementById("citizen-report-modal");
    if (modal) modal.classList.add("hidden");
  }

  // Admin CSV Telemetry Export
  exportTelemetryCSV() {
    let csv = "Station ID,Station Name,Compostable Fill (%),Decomposable Fill (%),Battery (%),Solar Status\n";
    Object.values(this.state.stations).forEach(s => {
      csv += `"${s.id}","${s.name.replace(/"/g, '""')}",${s.compostable.fillLevel},${s.decomposable.fillLevel},${s.batteryPercent}%,"${s.solarCharging ? 'Yes' : 'No'}"\n`;
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

  // Audio synthesis
  playSound(type) {
    if (!this.state.audioAlertsEnabled) return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      const now = this.audioContext.currentTime;

      if (type === "servo") {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "clunk") {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "drop") {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "alarm") {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.setValueAtTime(980, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }
    } catch (e) {
      console.log("Audio play error:", e);
    }
  }

  // Render station selector buttons
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
        <button onclick="window.app.switchStation('${station.id}')" class="station-pill ${activeClass} ${criticalClass}">
          ${statusDot}
          <span>${station.id}: ${station.name.split("&")[0].trim()}</span>
          <span class="text-[10px] font-mono opacity-60">(${Math.max(station.compostable.fillLevel, station.decomposable.fillLevel)}%)</span>
        </button>
      `;
    }).join("");
  }

  // Render city-wide fleet grid overview
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
        <div onclick="window.app.switchStation('${station.id}')" class="fleet-card ${isActive ? 'active-fleet' : ''}">
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
            <span class="text-sky-400 font-semibold hover:underline">Select &rarr;</span>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  // Switch Active Dustbin Station
  switchStation(stationId) {
    if (!this.state.stations[stationId]) return;
    this.state.currentStationId = stationId;

    const station = this.state.stations[stationId];
    this.saveState();

    this.renderStationSelector();
    this.renderFleetGrid();
    this.renderAll();

    if (this.map && station.coords) {
      this.map.flyTo(station.coords, 14, { animate: true, duration: 1.2 });
      if (this.stationMarkers[stationId]) {
        this.stationMarkers[stationId].openPopup();
      }
    }

    this.showToast(`📍 Selected ${station.id}: ${station.name}`, "info");
  }

  calculateDistance(fillPercentage, totalHeightCm = 100) {
    return Math.max(0, Math.round(totalHeightCm * (1 - fillPercentage / 100)));
  }

  renderAll() {
    const station = this.getCurrentStation();

    const stationNameEl = document.getElementById("active-station-name");
    const stationZoneEl = document.getElementById("active-station-zone");
    const stationBatteryEl = document.getElementById("active-station-battery");
    const citizenDistEl = document.getElementById("citizen-nearest-distance");

    if (stationNameEl) stationNameEl.innerText = `${station.id}: ${station.name}`;
    if (stationZoneEl) stationZoneEl.innerHTML = station.zone;
    if (stationBatteryEl) stationBatteryEl.innerText = `${station.batteryPercent}%`;
    if (citizenDistEl) citizenDistEl.innerText = `${station.distanceMeters || 120}m away`;

    // Eco points in citizen header
    const ptsEl = document.getElementById("citizen-points-counter");
    const rankEl = document.getElementById("citizen-rank-label");
    if (ptsEl) ptsEl.innerText = `${this.state.citizenPoints} Pts`;
    if (rankEl) rankEl.innerText = this.state.citizenRank;

    this.renderBin("compostable", station.compostable);
    this.renderBin("decomposable", station.decomposable);
    this.renderStats();
    this.renderLogs();
    this.checkThresholdAlerts();
  }

  renderBin(binKey, binData) {
    const fill = binData.fillLevel;
    const distanceCm = this.calculateDistance(fill, binData.totalHeightCm);
    const litersCurrent = ((fill / 100) * binData.maxCapacityLiters).toFixed(1);

    const fillEl = document.getElementById(`${binKey}-fill`);
    const percentEl = document.getElementById(`${binKey}-percent`);
    const distanceEl = document.getElementById(`${binKey}-distance`);
    const litersEl = document.getElementById(`${binKey}-liters`);
    const weightEl = document.getElementById(`${binKey}-weight`);
    const statusBadgeEl = document.getElementById(`${binKey}-status-badge`);
    const dustbinEl = document.getElementById(`${binKey}-dustbin`);
    const overflowTimeEl = document.getElementById(`${binKey}-overflow-time`);
    const lcdScreen = document.getElementById(`${binKey}-lcd-fill`);

    if (fillEl) fillEl.style.height = `${fill}%`;
    if (percentEl) percentEl.innerText = `${fill}%`;
    if (distanceEl) distanceEl.innerText = `${distanceCm} cm`;
    if (litersEl) litersEl.innerText = `${litersCurrent} / ${binData.maxCapacityLiters} L`;
    if (weightEl) weightEl.innerText = `${binData.weightKg.toFixed(1)} kg`;

    if (lcdScreen) lcdScreen.innerText = `${fill}% (${litersCurrent}L)`;

    if (overflowTimeEl) {
      if (fill >= 90) {
        overflowTimeEl.innerHTML = `<span class="text-rose-400 font-bold">Overflow Imminent (&lt; 1 hr)</span>`;
      } else if (fill >= 75) {
        overflowTimeEl.innerHTML = `<span class="text-amber-400 font-medium">Approx. 4-6 hrs left</span>`;
      } else {
        const remainingHours = Math.round((100 - fill) * 0.4);
        overflowTimeEl.innerText = `~${remainingHours} hrs to capacity`;
      }
    }

    if (statusBadgeEl && dustbinEl) {
      if (fill >= 80) {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Critical Overflow Risk`;
        dustbinEl.classList.add("critical-bin-alarm");
      } else if (fill >= 60) {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> Approaching Full`;
        dustbinEl.classList.remove("critical-bin-alarm");
      } else {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Optimal Capacity`;
        dustbinEl.classList.remove("critical-bin-alarm");
      }
    }
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
      alertText.innerText = `${criticalStations.length} Station(s) Exceeded Capacity: ${stationNames} — Run Smart Route Optimization!`;
      this.playSound("alarm");
    } else {
      alertBanner.classList.add("hidden");
    }
  }

  openLid(binKey, autoCloseMs = 3000) {
    const station = this.getCurrentStation();
    const bin = station[binKey];
    if (!bin) return;

    const lidEl = document.getElementById(`${binKey}-lid`);
    const ledDot = document.getElementById(`${binKey}-led-dot`);
    const lcdLidStatus = document.getElementById(`${binKey}-lcd-lid-status`);

    bin.lidOpen = true;
    if (lidEl) lidEl.classList.add("lid-open");
    if (ledDot) {
      ledDot.classList.add("dot-open");
      ledDot.style.background = "#38bdf8";
    }
    if (lcdLidStatus) {
      lcdLidStatus.innerText = "LID: OPEN";
      lcdLidStatus.className = "text-[11px] font-mono font-bold text-sky-400 animate-pulse";
    }

    this.playSound("servo");

    if (bin.lidCloseTimeout) clearTimeout(bin.lidCloseTimeout);
    if (autoCloseMs > 0) {
      bin.lidCloseTimeout = setTimeout(() => {
        this.closeLid(binKey);
      }, autoCloseMs);
    }
  }

  closeLid(binKey) {
    const station = this.getCurrentStation();
    const bin = station[binKey];
    if (!bin) return;

    const lidEl = document.getElementById(`${binKey}-lid`);
    const ledDot = document.getElementById(`${binKey}-led-dot`);
    const lcdLidStatus = document.getElementById(`${binKey}-lcd-lid-status`);

    bin.lidOpen = false;
    if (lidEl) lidEl.classList.remove("lid-open");
    if (ledDot) {
      ledDot.classList.remove("dot-open");
      ledDot.style.background = binKey === "compostable" ? "#10b981" : "#f59e0b";
    }
    if (lcdLidStatus) {
      lcdLidStatus.innerText = "LID: CLOSED";
      lcdLidStatus.className = "text-[11px] font-mono text-slate-400";
    }

    this.playSound("clunk");
  }

  waveHandOverBin(binKey) {
    this.openLid(binKey, 3500);
    this.showToast(`👋 Touchless Sensor: Lid Opened for ${binKey.toUpperCase()} at ${this.state.currentStationId}`, "info");
  }

  pressFootPedal(binKey) {
    const pedal = document.getElementById(`${binKey}-foot-pedal`);
    if (pedal) {
      pedal.classList.add("pedal-pressed");
      setTimeout(() => pedal.classList.remove("pedal-pressed"), 400);
    }
    this.openLid(binKey, 3000);
    this.showToast(`🦶 Foot Pedal Depressed: ${binKey.toUpperCase()} Lid Opened`, "info");
  }

  animateTrashDrop(binKey, icon = "🗑️") {
    const dustbinContainer = document.getElementById(`${binKey}-dustbin`);
    if (!dustbinContainer) return;

    this.openLid(binKey, 2500);

    const dropEl = document.createElement("div");
    dropEl.className = "dropping-trash-item";
    dropEl.innerText = icon;
    dropEl.style.top = "10px";
    dropEl.style.left = "48%";

    dustbinContainer.appendChild(dropEl);

    setTimeout(() => this.playSound("drop"), 450);
    setTimeout(() => dropEl.remove(), 1050);
  }

  depositWaste(binKey, percentAmount, itemName = "Waste Item", icon = "🗑️") {
    const station = this.getCurrentStation();
    const bin = station[binKey];
    if (!bin) return;

    this.animateTrashDrop(binKey, icon);

    const prevLevel = bin.fillLevel;
    const newLevel = Math.min(100, prevLevel + percentAmount);
    bin.fillLevel = newLevel;

    const weightIncrease = (percentAmount / 100) * (bin.maxCapacityLiters * 0.35);
    bin.weightKg = parseFloat((bin.weightKg + weightIncrease).toFixed(1));

    if (binKey === "compostable") {
      this.state.stats.totalCompostProducedKg += weightIncrease * 0.65;
      this.state.stats.co2EmissionsSavedKg += weightIncrease * 0.42;
    } else {
      this.state.stats.landfillDivertedKg += weightIncrease;
      this.state.stats.co2EmissionsSavedKg += weightIncrease * 0.28;
    }

    // Award Eco-Points in Citizen Mode
    this.addCitizenPoints(10);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.historyLogs.unshift({
      time: timeStr,
      station: station.id,
      type: "deposit",
      note: `Deposited ${itemName} (+${percentAmount}%) in ${station.id}`
    });

    this.saveState();
    this.renderAll();
    this.renderStationSelector();
    this.renderFleetGrid();
    this.updateMapMarker(station.id);
    this.updateChartsWithLatest();

    this.showToast(`✅ ${itemName} deposited! +10 Eco-Points earned 🌿`, "success");
  }

  emptyBin(binKey) {
    const station = this.getCurrentStation();
    const bin = station[binKey];
    if (!bin) return;

    this.openLid(binKey, 1500);

    const clearedKg = bin.weightKg;
    bin.fillLevel = 0;
    bin.weightKg = 0.5;

    this.state.stats.totalPickups += 1;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.historyLogs.unshift({
      time: timeStr,
      station: station.id,
      type: "empty",
      note: `[ADMIN ACTION] Cleared ${binKey} bin at ${station.id} (${clearedKg.toFixed(1)} kg)`
    });

    this.saveState();
    this.renderAll();
    this.renderStationSelector();
    this.renderFleetGrid();
    this.updateMapMarker(station.id);
    this.updateChartsWithLatest();

    this.showToast(`🎉 ${binKey.toUpperCase()} bin at ${station.id} emptied!`, "info");
  }

  // =========================================================================
  // DYNAMIC TSP ROUTE OPTIMIZATION (ADMIN FEATURE)
  // =========================================================================

  optimizeAndDispatchRoute() {
    if (this.state.pickupRouteActive) {
      this.showToast("🚚 Collection truck is currently on route!", "warning");
      return;
    }

    const stationsNeedingPickup = Object.values(this.state.stations).filter(s =>
      s.compostable.fillLevel >= 75 || s.decomposable.fillLevel >= 75
    );

    if (stationsNeedingPickup.length === 0) {
      this.showToast("🟢 All dustbins are currently within safe capacity (<75%). No route needed!", "info");
      return;
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
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    this.routePolyline = L.polyline(latLngs, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(this.map);

    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });

    this.showToast(`🚛 Smart Route Generated: Visiting ${stationsNeedingPickup.length} full stations`, "success");
    this.traverseTruckRoute(routeWaypoints);
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
          <span>Stops: <strong>${waypoints.length - 2} Pickups</strong></span>
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
        this.showToast("🎉 Route Complete: All critical stations emptied & processed at Bio-Plant!", "success");
        if (this.routePolyline) {
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

      const moveTimer = setInterval(() => {
        progress++;
        const lat = fromPoint[0] + (toPoint[0] - fromPoint[0]) * (progress / steps);
        const lng = fromPoint[1] + (toPoint[1] - fromPoint[1]) * (progress / steps);

        if (this.truckMarker) {
          this.truckMarker.setLatLng([lat, lng]);
        }

        if (progress >= steps) {
          clearInterval(moveTimer);
          currentIdx++;

          if (nextTarget.id !== "HUB-01") {
            const station = this.state.stations[nextTarget.id];
            if (station) {
              const collected = (station.compostable.weightKg + station.decomposable.weightKg).toFixed(1);
              station.compostable.fillLevel = 0;
              station.compostable.weightKg = 0.5;
              station.decomposable.fillLevel = 0;
              station.decomposable.weightKg = 0.5;

              this.state.stats.totalPickups += 1;
              this.state.stats.fuelSavedLiters += 2.4;

              this.updateMapMarker(station.id);
              this.renderStationSelector();
              this.renderFleetGrid();
              this.renderAll();

              this.showToast(`🚛 Cleared & Sanitized: ${station.name} (${collected} kg)`, "info");
            }
          }

          setTimeout(visitNextWaypoint, 1200);
        }
      }, 150);
    };

    visitNextWaypoint();
  }

  // Background IoT Telemetry Simulation
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

        if (binKey === "compostable") {
          bin.temperatureC = parseFloat((36 + Math.random() * 5).toFixed(1));
        }

        if (station.id === this.state.currentStationId) {
          this.renderBin(binKey, bin);
        }

        this.updateMapMarker(station.id);
        this.renderStationSelector();
        this.renderFleetGrid();
        this.checkThresholdAlerts();
      }
    }, 4500);
  }

  toggleIotStream() {
    this.state.iotSimulating = !this.state.iotSimulating;
    const btn = document.getElementById("toggle-iot-btn");
    const indicator = document.getElementById("iot-live-indicator");

    if (this.state.iotSimulating) {
      this.startIotStream();
      if (btn) btn.innerHTML = `<span class="badge-live-dot"></span><span>Live Feed</span>`;
      if (indicator) indicator.classList.remove("opacity-40");
      this.showToast("⚡ Real-time multi-bin telemetry feed ACTIVE", "info");
    } else {
      if (this.iotTimer) clearInterval(this.iotTimer);
      if (btn) btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Resume Feed</span>`;
      if (indicator) indicator.classList.add("opacity-40");
      this.showToast("⏸️ Feed paused", "info");
    }

    if (window.lucide) window.lucide.createIcons();
    this.saveState();
  }

  applyBinModel(modelClass) {
    this.state.activeModel = modelClass;
    const compBin = document.getElementById("compostable-dustbin");
    const decompBin = document.getElementById("decomposable-dustbin");

    const models = ["model-smart-kiosk", "model-wheelie-bin", "model-stainless-steel"];
    [compBin, decompBin].forEach(binEl => {
      if (!binEl) return;
      models.forEach(m => binEl.classList.remove(m));
      binEl.classList.add(modelClass);
    });

    document.querySelectorAll(".model-select-btn").forEach(btn => {
      if (btn.dataset.model === modelClass) {
        btn.classList.add("bg-emerald-500/20", "text-emerald-300", "border-emerald-500/40");
        btn.classList.remove("bg-slate-800", "text-slate-400", "border-slate-700");
      } else {
        btn.classList.remove("bg-emerald-500/20", "text-emerald-300", "border-emerald-500/40");
        btn.classList.add("bg-slate-800", "text-slate-400", "border-slate-700");
      }
    });

    this.saveState();
  }

  // Map Initialization
  initMap() {
    const mapEl = document.getElementById("smartbin-map");
    if (!mapEl || !window.L) return;

    this.map = L.map("smartbin-map", {
      zoomControl: false,
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
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #10b981;">${station.id}: ${station.name}</h4>
          <p style="font-size: 11px; margin: 0 0 6px 0; color: #cbd5e1;">Compostable: <strong>${station.compostable.fillLevel}%</strong> | Decomposable: <strong>${station.decomposable.fillLevel}%</strong></p>
          <button onclick="window.app.switchStation('${station.id}')" style="background: #10b981; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
            Open Dustbin View
          </button>
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

  renderStats() {
    const compProduced = document.getElementById("stat-compost-kg");
    const co2Saved = document.getElementById("stat-co2-kg");
    const landfillSaved = document.getElementById("stat-landfill-kg");
    const pickupsCount = document.getElementById("stat-pickups");

    if (compProduced) compProduced.innerText = `${this.state.stats.totalCompostProducedKg.toFixed(1)} kg`;
    if (co2Saved) co2Saved.innerText = `${this.state.stats.co2EmissionsSavedKg.toFixed(1)} kg`;
    if (landfillSaved) landfillSaved.innerText = `${this.state.stats.landfillDivertedKg.toFixed(1)} kg`;
    if (pickupsCount) pickupsCount.innerText = `${this.state.stats.totalPickups}`;
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

  initCharts() {
    const trendCtx = document.getElementById("fill-trend-chart");
    const pieCtx = document.getElementById("waste-breakdown-chart");

    if (trendCtx && window.Chart) {
      this.charts.trend = new Chart(trendCtx, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
          datasets: [
            {
              label: "Compostable Avg (%)",
              data: [42, 58, 30, 65, 52, 70, this.getCurrentStation().compostable.fillLevel],
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true
            },
            {
              label: "Decomposable Avg (%)",
              data: [35, 45, 50, 40, 60, 55, this.getCurrentStation().decomposable.fillLevel],
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#94a3b8" } } },
          scales: {
            y: { min: 0, max: 100, grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", callback: (val) => val + "%" } },
            x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8" } }
          }
        }
      });
    }

    if (pieCtx && window.Chart) {
      const station = this.getCurrentStation();
      this.charts.pie = new Chart(pieCtx, {
        type: "doughnut",
        data: {
          labels: ["Compostable (Wet Organic)", "Decomposable (Dry Fibers)"],
          datasets: [{
            data: [station.compostable.fillLevel || 1, station.decomposable.fillLevel || 1],
            backgroundColor: ["#10b981", "#f59e0b"],
            borderWidth: 2,
            borderColor: "#0f172a"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { color: "#94a3b8" } } },
          cutout: "68%"
        }
      });
    }
  }

  updateChartsWithLatest() {
    const station = this.getCurrentStation();
    if (this.charts.trend) {
      const compData = this.charts.trend.data.datasets[0].data;
      const decompData = this.charts.trend.data.datasets[1].data;
      compData[compData.length - 1] = station.compostable.fillLevel;
      decompData[decompData.length - 1] = station.decomposable.fillLevel;
      this.charts.trend.update();
    }
    if (this.charts.pie) {
      this.charts.pie.data.datasets[0].data = [
        station.compostable.fillLevel || 1,
        station.decomposable.fillLevel || 1
      ];
      this.charts.pie.update();
    }
  }

  searchWasteItem(query) {
    const resultsContainer = document.getElementById("classifier-results");
    if (!resultsContainer) return;

    if (!query || query.trim().length === 0) {
      resultsContainer.innerHTML = `
        <div class="col-span-full text-center py-6 text-slate-400">
          <p class="text-sm font-medium">Type any item above or click a tag to see which dustbin it belongs to.</p>
        </div>
      `;
      return;
    }

    const cleanQuery = query.toLowerCase().trim();
    const matches = WASTE_DATABASE.filter(item => 
      item.name.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery)
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="col-span-full p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
          <div class="text-amber-400 font-semibold mb-1">Unrecognized Waste: "${query}"</div>
          <p class="text-xs text-slate-300 max-w-md mx-auto mb-3">
            Organic food/garden scraps go into <strong>Compostable Dustbin</strong>.
            Dry untreated paper/cardboard fibers go into <strong>Decomposable Dustbin</strong>.
          </p>
          <div class="flex justify-center gap-2">
            <button onclick="window.app.depositWaste('compostable', 5, '${query}', '🥗')" class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium">
              Deposit to Compostable (+5%)
            </button>
            <button onclick="window.app.depositWaste('decomposable', 5, '${query}', '📦')" class="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium">
              Deposit to Decomposable (+5%)
            </button>
          </div>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matches.map(item => {
      let badgeClass = "";
      let buttonHtml = "";

      if (item.category === "compostable") {
        badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
        buttonHtml = `
          <button onclick="window.app.depositWaste('compostable', 6, '${item.name}', '${item.icon}')" class="mt-3 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md">
            <span>${item.icon}</span> Drop in Compostable Dustbin (+6%)
          </button>
        `;
      } else if (item.category === "decomposable") {
        badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
        buttonHtml = `
          <button onclick="window.app.depositWaste('decomposable', 8, '${item.name}', '${item.icon}')" class="mt-3 w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md">
            <span>${item.icon}</span> Drop in Decomposable Dustbin (+8%)
          </button>
        `;
      } else {
        badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/40";
        buttonHtml = `
          <div class="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            ⛔ DO NOT PUT IN ORGANIC BINS - Segregate to Dry Recyclables / Landfill
          </div>
        `;
      }

      return `
        <div class="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">${item.icon}</span>
                <h4 class="font-bold text-slate-100 text-sm">${item.name}</h4>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${badgeClass}">
                ${item.category}
              </span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-300">
              <div>Decomposition Time: <strong class="text-slate-200">${item.time}</strong></div>
              <p class="text-slate-400 text-xs mt-1 leading-relaxed">${item.tip}</p>
            </div>
          </div>
          ${buttonHtml}
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    let borderColor = "border-emerald-500/50 bg-slate-900/90 text-emerald-300";
    if (type === "warning") borderColor = "border-amber-500/50 bg-slate-900/90 text-amber-300";
    if (type === "danger") borderColor = "border-rose-500/50 bg-slate-900/90 text-rose-300";

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
    // Role switcher buttons
    const roleCitizenBtn = document.getElementById("role-btn-citizen");
    const roleAdminBtn = document.getElementById("role-btn-admin");

    if (roleCitizenBtn) {
      roleCitizenBtn.addEventListener("click", () => this.applyRole("citizen"));
    }
    if (roleAdminBtn) {
      roleAdminBtn.addEventListener("click", () => this.applyRole("admin"));
    }

    // Model select buttons
    document.querySelectorAll(".model-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const model = btn.dataset.model;
        this.applyBinModel(model);
        this.showToast(`🎨 Dustbin UI changed to: ${btn.innerText.trim()}`, "info");
      });
    });

    // Touchless Hand Wave Sensor buttons
    document.querySelectorAll("[data-wave-sensor]").forEach(btn => {
      btn.addEventListener("click", () => {
        const binKey = btn.dataset.waveSensor;
        this.waveHandOverBin(binKey);
      });
    });

    // Foot pedal clicks
    document.querySelectorAll(".dustbin-foot-pedal").forEach(pedal => {
      pedal.addEventListener("click", () => {
        const binKey = pedal.dataset.pedalBin;
        this.pressFootPedal(binKey);
      });
    });

    // Direct lid clicks
    document.querySelectorAll(".dustbin-lid").forEach(lid => {
      lid.addEventListener("click", () => {
        const binKey = lid.dataset.lidBin;
        const station = this.getCurrentStation();
        if (station[binKey].lidOpen) {
          this.closeLid(binKey);
        } else {
          this.openLid(binKey, 3000);
        }
      });
    });

    // Deposit buttons
    document.querySelectorAll("[data-deposit-bin]").forEach(btn => {
      btn.addEventListener("click", () => {
        const bin = btn.dataset.depositBin;
        const amount = parseInt(btn.dataset.depositAmount, 10) || 5;
        const label = btn.dataset.depositLabel || "Waste item";
        const icon = btn.dataset.depositIcon || "🗑️";
        this.depositWaste(bin, amount, label, icon);
      });
    });

    // Empty bin buttons (Admin only)
    document.querySelectorAll("[data-empty-bin]").forEach(btn => {
      btn.addEventListener("click", () => {
        const bin = btn.dataset.emptyBin;
        if (confirm(`Confirm emptying the ${bin.toUpperCase()} dustbin at ${this.state.currentStationId}?`)) {
          this.emptyBin(bin);
        }
      });
    });

    // Toggle IoT feed
    const toggleIotBtn = document.getElementById("toggle-iot-btn");
    if (toggleIotBtn) {
      toggleIotBtn.addEventListener("click", () => this.toggleIotStream());
    }

    // Toggle Sound alerts
    const toggleSoundBtn = document.getElementById("toggle-sound-btn");
    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener("click", () => {
        this.state.audioAlertsEnabled = !this.state.audioAlertsEnabled;
        toggleSoundBtn.innerHTML = this.state.audioAlertsEnabled 
          ? `<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i>`
          : `<i data-lucide="volume-x" class="w-4 h-4 text-slate-500"></i>`;
        this.showToast(this.state.audioAlertsEnabled ? "🔊 Sound effects enabled" : "🔇 Sound effects muted", "info");
        if (window.lucide) window.lucide.createIcons();
        this.saveState();
      });
    }

    // Optimize Route Button (Admin)
    const optimizeBtn = document.getElementById("optimize-route-btn");
    if (optimizeBtn) {
      optimizeBtn.addEventListener("click", () => this.optimizeAndDispatchRoute());
    }

    // CSV Export Button (Admin)
    const exportCsvBtn = document.getElementById("export-csv-btn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportTelemetryCSV());
    }

    // Citizen Report Issue Modal Controls
    const openReportModalBtn = document.getElementById("open-report-modal");
    const closeReportModalBtn = document.getElementById("close-report-modal");
    const reportModal = document.getElementById("citizen-report-modal");
    const reportForm = document.getElementById("citizen-report-form");

    if (openReportModalBtn && reportModal) {
      openReportModalBtn.addEventListener("click", () => reportModal.classList.remove("hidden"));
    }
    if (closeReportModalBtn && reportModal) {
      closeReportModalBtn.addEventListener("click", () => reportModal.classList.add("hidden"));
    }
    if (reportForm) {
      reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const type = document.getElementById("report-issue-type")?.value || "Overflow";
        const note = document.getElementById("report-issue-note")?.value || "Dustbin full";
        this.submitCitizenReport(type, note);
      });
    }

    // Classifier search input
    const searchInput = document.getElementById("waste-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => this.searchWasteItem(e.target.value));
    }

    // Quick tag search buttons
    document.querySelectorAll(".quick-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const val = tag.innerText.trim();
        if (searchInput) {
          searchInput.value = val;
          this.searchWasteItem(val);
        }
      });
    });

    // Sliders (Admin only)
    const compSlider = document.getElementById("slider-compostable");
    if (compSlider) {
      compSlider.value = this.getCurrentStation().compostable.fillLevel;
      compSlider.addEventListener("input", (e) => {
        this.getCurrentStation().compostable.fillLevel = parseInt(e.target.value, 10);
        this.renderBin("compostable", this.getCurrentStation().compostable);
        this.updateChartsWithLatest();
      });
    }

    const decompSlider = document.getElementById("slider-decomposable");
    if (decompSlider) {
      decompSlider.value = this.getCurrentStation().decomposable.fillLevel;
      decompSlider.addEventListener("input", (e) => {
        this.getCurrentStation().decomposable.fillLevel = parseInt(e.target.value, 10);
        this.renderBin("decomposable", this.getCurrentStation().decomposable);
        this.updateChartsWithLatest();
      });
    }

    // Hardware Modal
    const openHardwareModalBtn = document.getElementById("open-hardware-modal");
    const closeHardwareModalBtn = document.getElementById("close-hardware-modal");
    const hardwareModal = document.getElementById("hardware-modal");

    if (openHardwareModalBtn && hardwareModal) {
      openHardwareModalBtn.addEventListener("click", () => hardwareModal.classList.remove("hidden"));
    }
    if (closeHardwareModalBtn && hardwareModal) {
      closeHardwareModalBtn.addEventListener("click", () => hardwareModal.classList.add("hidden"));
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new SmartBinApp();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
