/**
 * EcoPulse SmartBin OS - Core Management Engine
 * Real-life Waste Management System with Realistic 3D Dustbin UI
 */

const DEFAULT_STATE = {
  activeModel: "model-smart-kiosk", // "model-smart-kiosk", "model-wheelie-bin", "model-stainless-steel"
  bins: {
    compostable: {
      name: "Compostable Waste",
      type: "organic",
      color: "#10b981",
      fillLevel: 68,
      maxCapacityLiters: 60,
      totalHeightCm: 100,
      weightKg: 16.8,
      temperatureC: 38.5,
      moisturePercent: 65,
      odorIndex: "Low (Safe)",
      lidOpen: false,
      lastEmptied: "2026-09-27 08:30",
      alertThreshold: 80,
      itemsSample: ["Vegetable scraps", "Coffee grounds", "Fruit peels", "Egg shells", "Leaves"]
    },
    decomposable: {
      name: "Decomposable Waste",
      type: "biodegradable",
      color: "#f59e0b",
      fillLevel: 42,
      maxCapacityLiters: 80,
      totalHeightCm: 100,
      weightKg: 9.4,
      humidityPercent: 44,
      degradeRate: "Medium (2-8 Weeks)",
      lidOpen: false,
      lastEmptied: "2026-09-26 14:15",
      alertThreshold: 80,
      itemsSample: ["Cardboard packaging", "Untreated paper", "Egg cartons", "Paper bags", "Sawdust"]
    }
  },
  iotSimulating: true,
  audioAlertsEnabled: true,
  pickupStatus: {
    requested: false,
    truckEtaMinutes: null,
    truckStep: 0,
    requestId: null
  },
  historyLogs: [
    { time: "18:45:10", type: "deposit", bin: "compostable", amount: "+8%", note: "Cafeteria food scraps deposited" },
    { time: "17:20:04", type: "deposit", bin: "decomposable", amount: "+12%", note: "Packaging boxes shredded & deposited" },
    { time: "15:05:32", type: "alert", bin: "compostable", amount: "65%", note: "Level exceeded 60% standard marker" },
    { time: "11:30:00", type: "empty", bin: "compostable", amount: "0%", note: "Municipal Organic Collector cleared bin" }
  ],
  stats: {
    totalCompostProducedKg: 142.5,
    co2EmissionsSavedKg: 89.2,
    landfillDivertedKg: 284.0,
    totalPickups: 14
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

  // Non-decomposable warnings
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
    this.binMarker = null;
    this.truckMarker = null;
    this.routeLine = null;
    this.charts = {};

    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem("ecopulse_smartbin_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          bins: {
            compostable: { ...DEFAULT_STATE.bins.compostable, ...parsed.bins?.compostable, lidOpen: false },
            decomposable: { ...DEFAULT_STATE.bins.decomposable, ...parsed.bins?.decomposable, lidOpen: false }
          }
        };
      }
    } catch (e) {
      console.warn("Could not load stored state, using defaults:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem("ecopulse_smartbin_state", JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }

  init() {
    this.applyBinModel(this.state.activeModel);
    this.populateInternalFloatingItems("compostable", ["🍌", "🍎", "🥬", "☕", "🍂"]);
    this.populateInternalFloatingItems("decomposable", ["📦", "🛍️", "📰", "🥡", "🪵"]);

    this.renderAll();
    this.setupEventListeners();
    this.initCharts();
    this.initMap();

    if (this.state.iotSimulating) {
      this.startIotStream();
    }
  }

  // Populate floating visual trash icons inside the cutaway window
  populateInternalFloatingItems(binKey, icons) {
    const container = document.getElementById(`${binKey}-stacked-icons`);
    if (!container) return;
    container.innerHTML = "";

    icons.forEach((icon, i) => {
      const el = document.createElement("div");
      el.className = "floating-waste-badge";
      el.innerText = icon;
      el.style.left = `${12 + (i % 4) * 22}%`;
      el.style.bottom = `${15 + (i * 14)}%`;
      el.style.animationDelay = `${i * 0.7}s`;
      el.style.animationDuration = `${3.5 + (i % 2)}s`;
      container.appendChild(el);
    });
  }

  // Audio synthesis: Servo whir for lid, clunk for close, drop thud
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
        // High-tech motorized lid opening servo whir
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
        // Lid closing mechanical latch
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
        // Trash dropping thud
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
        // High-priority overflow alert
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

  // Interactive Dustbin Lid Control
  openLid(binKey, autoCloseMs = 3000) {
    const bin = this.state.bins[binKey];
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

    // Automatically close lid after delay
    if (bin.lidCloseTimeout) clearTimeout(bin.lidCloseTimeout);
    if (autoCloseMs > 0) {
      bin.lidCloseTimeout = setTimeout(() => {
        this.closeLid(binKey);
      }, autoCloseMs);
    }
  }

  closeLid(binKey) {
    const bin = this.state.bins[binKey];
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

  // Trigger touchless infrared hand-wave simulation
  waveHandOverBin(binKey) {
    this.openLid(binKey, 3500);
    this.showToast(`👋 Proximity Sensor: Touchless Lid Opened for ${this.state.bins[binKey].name}`, "info");
  }

  // Press physical foot pedal
  pressFootPedal(binKey) {
    const pedal = document.getElementById(`${binKey}-foot-pedal`);
    if (pedal) {
      pedal.classList.add("pedal-pressed");
      setTimeout(() => pedal.classList.remove("pedal-pressed"), 400);
    }
    this.openLid(binKey, 3000);
    this.showToast(`🦶 Foot Pedal Depressed: ${this.state.bins[binKey].name} Lid Opened`, "info");
  }

  // Animate physical trash falling into the dustbin
  animateTrashDrop(binKey, icon = "🗑️") {
    const dustbinContainer = document.getElementById(`${binKey}-dustbin`);
    if (!dustbinContainer) return;

    // Open lid first
    this.openLid(binKey, 2500);

    const dropEl = document.createElement("div");
    dropEl.className = "dropping-trash-item";
    dropEl.innerText = icon;
    dropEl.style.top = "10px";
    dropEl.style.left = "48%";

    dustbinContainer.appendChild(dropEl);

    setTimeout(() => {
      this.playSound("drop");
    }, 450);

    setTimeout(() => {
      dropEl.remove();
    }, 1050);
  }

  // Switch Dustbin Aesthetic Model (Smart Kiosk vs Wheelie Bin vs Stainless Steel)
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

    // Update active button state
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

  // Calculate distance from sensor (top) to waste surface
  calculateDistance(fillPercentage, totalHeightCm = 100) {
    return Math.max(0, Math.round(totalHeightCm * (1 - fillPercentage / 100)));
  }

  // Render fill visuals & stats
  renderAll() {
    this.renderBin("compostable");
    this.renderBin("decomposable");
    this.renderStats();
    this.renderLogs();
    this.checkThresholdAlerts();
    this.updatePickupUI();
  }

  renderBin(binKey) {
    const bin = this.state.bins[binKey];
    const fill = bin.fillLevel;
    const distanceCm = this.calculateDistance(fill, bin.totalHeightCm);
    const litersCurrent = ((fill / 100) * bin.maxCapacityLiters).toFixed(1);
    const isCritical = fill >= bin.alertThreshold;

    // Elements
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
    if (litersEl) litersEl.innerText = `${litersCurrent} / ${bin.maxCapacityLiters} L`;
    if (weightEl) weightEl.innerText = `${bin.weightKg.toFixed(1)} kg`;

    if (lcdScreen) {
      lcdScreen.innerText = `${fill}% (${litersCurrent}L)`;
    }

    if (overflowTimeEl) {
      if (fill >= 95) {
        overflowTimeEl.innerHTML = `<span class="text-rose-400 font-bold">Overflow Imminent (&lt; 1 hr)</span>`;
      } else if (fill >= 80) {
        overflowTimeEl.innerHTML = `<span class="text-amber-400 font-medium">Approx. 4-6 hrs left</span>`;
      } else {
        const remainingHours = Math.round((100 - fill) * 0.4);
        overflowTimeEl.innerText = `~${remainingHours} hrs to capacity`;
      }
    }

    // Status Badge & Border glow
    if (statusBadgeEl && dustbinEl) {
      if (fill >= 90) {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Critical Overflow Risk`;
        dustbinEl.classList.add("critical-bin-alarm");
      } else if (fill >= 75) {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> Approaching Full`;
        dustbinEl.classList.remove("critical-bin-alarm");
      } else if (fill >= 40) {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Moderate Fill`;
        dustbinEl.classList.remove("critical-bin-alarm");
      } else {
        statusBadgeEl.className = "px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5";
        statusBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400"></span> Optimal Capacity`;
        dustbinEl.classList.remove("critical-bin-alarm");
      }
    }
  }

  checkThresholdAlerts() {
    const alertBanner = document.getElementById("critical-alert-banner");
    const alertText = document.getElementById("critical-alert-text");
    if (!alertBanner || !alertText) return;

    const compFill = this.state.bins.compostable.fillLevel;
    const decompFill = this.state.bins.decomposable.fillLevel;

    const warnings = [];
    if (compFill >= 85) warnings.push(`Compostable Dustbin is at ${compFill}% (Sensor: ${this.calculateDistance(compFill)}cm)`);
    if (decompFill >= 85) warnings.push(`Decomposable Dustbin is at ${decompFill}% (Sensor: ${this.calculateDistance(decompFill)}cm)`);

    if (warnings.length > 0) {
      alertBanner.classList.remove("hidden");
      alertText.innerText = warnings.join(" | ") + " — Automated Collection Triggered!";
      this.playSound("alarm");
    } else {
      alertBanner.classList.add("hidden");
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
        iconColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
        icon = "alert-circle";
      }

      return `
        <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 transition-all">
          <div class="p-2 rounded-lg border ${iconColor} flex-shrink-0">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold capitalize text-slate-200">${log.bin} Bin (${log.amount})</span>
              <span class="text-[10px] font-mono text-slate-400">${log.time}</span>
            </div>
            <p class="text-xs text-slate-400 truncate mt-0.5">${log.note}</p>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  depositWaste(binKey, percentAmount, itemName = "Waste Item", icon = "🗑️") {
    const bin = this.state.bins[binKey];
    if (!bin) return;

    // Trigger physical animation
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

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.historyLogs.unshift({
      time: timeStr,
      type: "deposit",
      bin: binKey,
      amount: `+${percentAmount}%`,
      note: `Deposited ${itemName}`
    });

    this.saveState();
    this.renderAll();
    this.updateChartsWithLatest();

    this.showToast(`✅ ${itemName} deposited into ${bin.name} (+${percentAmount}%)`, "success");
  }

  emptyBin(binKey) {
    const bin = this.state.bins[binKey];
    if (!bin) return;

    this.openLid(binKey, 1500);

    const clearedKg = bin.weightKg;
    bin.fillLevel = 0;
    bin.weightKg = 0.5;
    bin.lastEmptied = new Date().toISOString().replace('T', ' ').substring(0, 16);

    this.state.stats.totalPickups += 1;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.historyLogs.unshift({
      time: timeStr,
      type: "empty",
      bin: binKey,
      amount: "0%",
      note: `Emptied & sanitized (${clearedKg.toFixed(1)} kg collected)`
    });

    this.saveState();
    this.renderAll();
    this.updateChartsWithLatest();
    this.showToast(`🎉 ${bin.name} emptied & sanitized! Ready for new waste.`, "info");
  }

  startIotStream() {
    if (this.iotTimer) clearInterval(this.iotTimer);

    this.iotTimer = setInterval(() => {
      if (!this.state.iotSimulating) return;

      const roll = Math.random();
      if (roll > 0.65) {
        const binKey = Math.random() > 0.5 ? "compostable" : "decomposable";
        const bin = this.state.bins[binKey];

        if (bin.fillLevel < 95) {
          const delta = Math.floor(Math.random() * 2) + 1;
          bin.fillLevel = Math.min(100, bin.fillLevel + delta);
          bin.weightKg = parseFloat((bin.weightKg + delta * 0.25).toFixed(1));

          if (binKey === "compostable") {
            bin.temperatureC = parseFloat((37 + Math.random() * 4).toFixed(1));
          }

          this.renderBin(binKey);
          this.checkThresholdAlerts();
        }
      }
    }, 4500);
  }

  toggleIotStream() {
    this.state.iotSimulating = !this.state.iotSimulating;
    const btn = document.getElementById("toggle-iot-btn");
    const indicator = document.getElementById("iot-live-indicator");

    if (this.state.iotSimulating) {
      this.startIotStream();
      if (btn) btn.innerHTML = `<span class="badge-live-dot"></span><span>Live IoT Feed</span>`;
      if (indicator) indicator.classList.remove("opacity-40");
      this.showToast("⚡ Real-time IoT sensor telemetry feed ACTIVE", "info");
    } else {
      if (this.iotTimer) clearInterval(this.iotTimer);
      if (btn) btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Resume Feed</span>`;
      if (indicator) indicator.classList.add("opacity-40");
      this.showToast("⏸️ IoT feed paused (Manual Mode)", "info");
    }

    if (window.lucide) window.lucide.createIcons();
    this.saveState();
  }

  requestPickup() {
    if (this.state.pickupStatus.requested) {
      this.showToast("🚚 Collection truck is already en route!", "warning");
      return;
    }

    this.state.pickupStatus = {
      requested: true,
      truckEtaMinutes: 10,
      truckStep: 0,
      requestId: "REQ-" + Math.floor(1000 + Math.random() * 9000)
    };

    this.updatePickupUI();
    this.animateTruckPickup();
    this.showToast("🚛 Smart Dispatch: Municipal Truck routed to Station #104 (ETA: 10 mins)", "success");
    this.saveState();
  }

  updatePickupUI() {
    const banner = document.getElementById("truck-dispatch-status");
    const reqBtn = document.getElementById("request-pickup-btn");
    const etaText = document.getElementById("truck-eta-text");
    const reqIdText = document.getElementById("truck-req-id");

    if (!banner || !reqBtn) return;

    if (this.state.pickupStatus.requested) {
      banner.classList.remove("hidden");
      reqBtn.disabled = true;
      reqBtn.classList.add("opacity-50", "cursor-not-allowed");
      if (etaText) etaText.innerText = `${this.state.pickupStatus.truckEtaMinutes} mins`;
      if (reqIdText) reqIdText.innerText = this.state.pickupStatus.requestId;
    } else {
      banner.classList.add("hidden");
      reqBtn.disabled = false;
      reqBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  animateTruckPickup() {
    if (!this.map || !this.state.pickupStatus.requested) return;

    const startPos = [12.9716, 77.5946];
    const binPos = [12.9850, 77.6100];

    let step = 0;
    const totalSteps = 5;

    const truckInterval = setInterval(() => {
      step++;
      const lat = startPos[0] + (binPos[0] - startPos[0]) * (step / totalSteps);
      const lng = startPos[1] + (binPos[1] - startPos[1]) * (step / totalSteps);

      if (this.truckMarker) {
        this.truckMarker.setLatLng([lat, lng]);
      }

      this.state.pickupStatus.truckEtaMinutes = Math.max(1, 10 - step * 2);
      this.updatePickupUI();

      if (step >= totalSteps) {
        clearInterval(truckInterval);
        this.emptyBin("compostable");
        this.emptyBin("decomposable");

        this.state.pickupStatus = {
          requested: false,
          truckEtaMinutes: null,
          truckStep: 0,
          requestId: null
        };
        this.updatePickupUI();
        this.showToast("🎉 Waste Collection Complete! Both dustbins emptied & sanitized.", "success");
      }
    }, 2400);
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
              label: "Compostable Dustbin (%)",
              data: [35, 52, 20, 64, 45, 58, this.state.bins.compostable.fillLevel],
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: "#10b981"
            },
            {
              label: "Decomposable Dustbin (%)",
              data: [25, 38, 55, 30, 48, 62, this.state.bins.decomposable.fillLevel],
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: "#f59e0b"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#94a3b8" } }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#94a3b8", callback: (val) => val + "%" }
            },
            x: {
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#94a3b8" }
            }
          }
        }
      });
    }

    if (pieCtx && window.Chart) {
      this.charts.pie = new Chart(pieCtx, {
        type: "doughnut",
        data: {
          labels: ["Compostable (Wet Organic)", "Decomposable (Dry Fibers)"],
          datasets: [{
            data: [this.state.bins.compostable.fillLevel || 1, this.state.bins.decomposable.fillLevel || 1],
            backgroundColor: ["#10b981", "#f59e0b"],
            borderWidth: 2,
            borderColor: "#0f172a"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: "#94a3b8" } }
          },
          cutout: "68%"
        }
      });
    }
  }

  updateChartsWithLatest() {
    if (this.charts.trend) {
      const compData = this.charts.trend.data.datasets[0].data;
      const decompData = this.charts.trend.data.datasets[1].data;
      compData[compData.length - 1] = this.state.bins.compostable.fillLevel;
      decompData[decompData.length - 1] = this.state.bins.decomposable.fillLevel;
      this.charts.trend.update();
    }
    if (this.charts.pie) {
      this.charts.pie.data.datasets[0].data = [
        this.state.bins.compostable.fillLevel || 1,
        this.state.bins.decomposable.fillLevel || 1
      ];
      this.charts.pie.update();
    }
  }

  initMap() {
    const mapEl = document.getElementById("smartbin-map");
    if (!mapEl || !window.L) return;

    const binCoords = [12.9850, 77.6100];
    const hubCoords = [12.9716, 77.5946];

    this.map = L.map("smartbin-map", {
      zoomControl: false,
      attributionControl: false
    }).setView(binCoords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(this.map);

    const createMarkerIcon = (color) => {
      return L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background: ${color}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ${color}; border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    this.binMarker = L.marker(binCoords, { icon: createMarkerIcon("#10b981") }).addTo(this.map);
    this.binMarker.bindPopup(`
      <div style="font-family: var(--font-main); padding: 4px;">
        <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #10b981;">Dustbin Station #104</h4>
        <p style="font-size: 11px; margin: 0; color: #cbd5e1;">Compostable: ${this.state.bins.compostable.fillLevel}% | Decomposable: ${this.state.bins.decomposable.fillLevel}%</p>
      </div>
    `);

    const hubIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background: #3b82f6; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #3b82f6; border: 2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker(hubCoords, { icon: hubIcon }).addTo(this.map);

    this.truckMarker = L.marker(hubCoords, {
      icon: L.divIcon({
        className: 'truck-map-icon',
        html: `
          <div style="background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #f59e0b; border: 2px solid white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(this.map);

    this.routeLine = L.polyline([hubCoords, [12.9780, 77.6010], binCoords], {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 8'
    }).addTo(this.map);
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
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  setupEventListeners() {
    // Model switcher buttons
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
        if (this.state.bins[binKey].lidOpen) {
          this.closeLid(binKey);
        } else {
          this.openLid(binKey, 3000);
        }
      });
    });

    // Deposit buttons with item icon support
    document.querySelectorAll("[data-deposit-bin]").forEach(btn => {
      btn.addEventListener("click", () => {
        const bin = btn.dataset.depositBin;
        const amount = parseInt(btn.dataset.depositAmount, 10) || 5;
        const label = btn.dataset.depositLabel || "Waste item";
        const icon = btn.dataset.depositIcon || "🗑️";
        this.depositWaste(bin, amount, label, icon);
      });
    });

    // Empty bin buttons
    document.querySelectorAll("[data-empty-bin]").forEach(btn => {
      btn.addEventListener("click", () => {
        const bin = btn.dataset.emptyBin;
        if (confirm(`Confirm emptying the ${bin.toUpperCase()} dustbin?`)) {
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

    // Request pickup button
    const reqPickupBtn = document.getElementById("request-pickup-btn");
    if (reqPickupBtn) {
      reqPickupBtn.addEventListener("click", () => this.requestPickup());
    }

    // Classifier search input
    const searchInput = document.getElementById("waste-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchWasteItem(e.target.value);
      });
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

    // Sliders
    const compSlider = document.getElementById("slider-compostable");
    if (compSlider) {
      compSlider.value = this.state.bins.compostable.fillLevel;
      compSlider.addEventListener("input", (e) => {
        this.state.bins.compostable.fillLevel = parseInt(e.target.value, 10);
        this.renderBin("compostable");
        this.updateChartsWithLatest();
      });
    }

    const decompSlider = document.getElementById("slider-decomposable");
    if (decompSlider) {
      decompSlider.value = this.state.bins.decomposable.fillLevel;
      decompSlider.addEventListener("input", (e) => {
        this.state.bins.decomposable.fillLevel = parseInt(e.target.value, 10);
        this.renderBin("decomposable");
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
