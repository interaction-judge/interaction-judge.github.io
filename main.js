/* Interaction-as-a-Judge — site interactions (no build step). */
(function () {
  "use strict";

  /* ── Hero marquee ─────────────────────────────────────────── */
  // Clips composed from released ArenaPreferences trace frames (rev5-full).
  var MARQUEE_ROWS = [
    [
      { file: "neon-apex", label: "Synthwave racer [gaming]" },
      { file: "pixel-editor", label: "Pixel-art editor [content creation]" },
      { file: "fleet-map", label: "Fleet-tracking map [data & analytics]" },
      { file: "wordle", label: "Wordle clone [reference design]" },
      { file: "vault-sim", label: "Vault-cracking sim [simulations]" },
      { file: "pool-table", label: "Pool table [gaming]" },
      { file: "glass-notes", label: "Glass notes app [content creation]" },
      { file: "stargazing", label: "Stargazing dashboard [simulations]" },
    ],
    [
      { file: "platformer", label: "Cute 2D platformer [gaming]" },
      { file: "ultravision", label: "Ops analytics [data & analytics]" },
      { file: "retro-os", label: "RetroOS 98 desktop [simulations]" },
      { file: "draw-race", label: "Draw-your-own-track racer [content creation]" },
      { file: "go-board", label: "Go vs. AI [gaming]" },
      { file: "calc-watch", label: "Calculator watch [reference design]" },
      { file: "tshirt-analytics", label: "Apparel sales dashboard [data & analytics]" },
      { file: "nova-hop", label: "Night platformer [gaming]" },
    ],
    [
      { file: "andromeda", label: "Starship hangar [gaming]" },
      { file: "pulse-city", label: "Live city explorer [content creation]" },
      { file: "reaction-test", label: "Reaction-time tester [reference design]" },
      { file: "drift-racer", label: "Top-down drift racer [gaming]" },
      { file: "dashboard", label: "Portfolio dashboard [data & analytics]" },
      { file: "lander-duel", label: "Lander card battler [gaming]" },
      { file: "retro-racer", label: "Retro lane racer [gaming]" },
      { file: "neon-analytics", label: "Streaming analytics [data & analytics]" },
    ],
  ];

  function clipHTML(c, preload) {
    return (
      '<figure class="clip"><video src="assets/media/arena/' +
      c.file +
      '.mp4" autoplay muted loop playsinline preload="' + preload + '"></video><figcaption>' +
      c.label +
      "</figcaption></figure>"
    );
  }

  function fillRow(r) {
    var track = document.getElementById("marquee-row-" + r);
    if (!track || track.childElementCount) return;
    var clips = MARQUEE_ROWS[r];
    // The second copy only exists for the seamless loop; it reuses the cached
    // files, so don't let it compete for bandwidth at startup.
    track.innerHTML =
      clips.map(function (c) { return clipHTML(c, "auto"); }).join("") +
      clips.map(function (c) { return clipHTML(c, "none"); }).join("");
  }

  // Single curated row (rows 2-3 retired in the MACU-style pass).
  MARQUEE_ROWS[0] = [
    { file: "neon-apex", label: "Synthwave racer [gaming]" },
    { file: "pixel-editor", label: "Pixel-art editor [content creation]" },
    { file: "vault-sim", label: "Vault-cracking sim [simulations]" },
    { file: "wordle", label: "Wordle clone [reference design]" },
    { file: "neon-analytics", label: "Streaming analytics [data & analytics]" },
    { file: "platformer", label: "Cute 2D platformer [gaming]" },
    { file: "fleet-map", label: "Fleet-tracking map [data & analytics]" },
    { file: "pool-table", label: "Pool table [gaming]" },
    { file: "calc-watch", label: "Calculator watch [reference design]" },
    { file: "draw-race", label: "Draw-your-own-track racer [content creation]" },
  ];
  fillRow(0);

  /* ── Trajectory player ────────────────────────────────────── */
  var FPS = 2; // recordings run at 2 frames per second, one frame per step
  var pv = document.getElementById("pv");
  var stepsEl = document.getElementById("pv-steps");
  var hud = document.getElementById("pv-hud");
  var playBtn = document.getElementById("pv-play");

  if (pv && stepsEl) {
    fetch("assets/data/neonapex_steps.json")
      .then(function (r) { return r.json(); })
      .then(function (steps) {
        var frag = document.createDocumentFragment();
        steps.forEach(function (s) {
          var row = document.createElement("div");
          row.className = "pstep";
          row.dataset.step = s.s;
          var intent = s.intent || "(no comment this step)";
          row.innerHTML =
            '<span class="sno">' + String(s.s).padStart(2, "0") + "</span>" +
            "<span><span class=\"tool\">" + s.tool + "</span>" + intent + "</span>";
          row.addEventListener("click", function () {
            pv.currentTime = (s.s - 1) / FPS + 0.01;
            pv.play();
          });
          frag.appendChild(row);
        });
        stepsEl.appendChild(frag);

        var rows = stepsEl.querySelectorAll(".pstep");
        var current = -1;
        pv.addEventListener("timeupdate", function () {
          var step = Math.min(
            rows.length - 1,
            Math.floor(pv.currentTime * FPS)
          );
          if (step === current) return;
          if (current >= 0) rows[current].classList.remove("active");
          rows[step].classList.add("active");
          // Scroll only the log panel — scrollIntoView would drag the page.
          stepsEl.scrollTo({
            top: rows[step].offsetTop - stepsEl.clientHeight / 2 + 20,
            behavior: "smooth",
          });
          hud.textContent = "step " + (step + 1) + " / " + rows.length;
          current = step;
        });
      });

    playBtn.addEventListener("click", function () {
      if (pv.paused) {
        if (pv.ended) pv.currentTime = 0;
        pv.play();
        playBtn.textContent = "Pause";
      } else {
        pv.pause();
        playBtn.textContent = "Play";
      }
    });
    document.getElementById("pv-restart").addEventListener("click", function () {
      pv.currentTime = 0;
      pv.play();
      playBtn.textContent = "Pause";
    });

    // Start playing when scrolled into view the first time.
    var seen = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen) {
          seen = true;
          pv.play();
          playBtn.textContent = "Pause";
        }
      });
    }, { threshold: 0.4 }).observe(pv);
  }

  /* ── Strategy triptych ────────────────────────────────────── */
  var POLICIES = ["baseline", "programmatic", "interactive"];
  var triptych = document.getElementById("triptych");
  var tabs = document.getElementById("app-tabs");

  function loadApp(app) {
    POLICIES.forEach(function (p) {
      var v = triptych.querySelector('[data-policy="' + p + '"] video');
      v.src = "assets/media/strategies/" + app + "_" + p + ".mp4";
      v.load();
      v.play();
    });
  }

  if (triptych && tabs) {
    tabs.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".tab");
      if (!btn) return;
      tabs.querySelectorAll(".tab").forEach(function (t) {
        t.classList.toggle("active", t === btn);
      });
      loadApp(btn.dataset.app);
    });
    document
      .getElementById("tript-restart")
      .addEventListener("click", function () {
        triptych.querySelectorAll("video").forEach(function (v) {
          v.currentTime = 0;
          v.play();
        });
      });
    // Load the first app's three videos only when the section approaches view.
    var tloaded = false;
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !tloaded) {
          tloaded = true;
          loadApp("neonapex");
          tio.disconnect();
        }
      });
    }, { rootMargin: "600px" });
    tio.observe(triptych);
  }

  /* ── Repair cards ─────────────────────────────────────────── */
  var REPAIRS = [
    {
      id: "metroidvania",
      game: "Abyssal Chronicles · metroidvania",
      req: "“The player must be able to stand on platforms.”",
      quote: "u destroyed the system where the player can stand on the platforms",
      note:
        "Same inputs on both versions: walk right and jump. In the broken build the player sinks through every platform and falls out of the world.",
    },
    {
      id: "tetris",
      game: "Tetris clone · arcade",
      req: "“A single key press must not move a falling piece halfway across the screen.”",
      quote: null,
      note:
        "Five identical taps of ← and →. The broken build auto-repeats after 200 ms, so a normal tap flings the piece several columns.",
    },
    {
      id: "voxel",
      game: "VoxelCraft · sandbox",
      req: "“Land must be present in the artifact.”",
      quote: null,
      note:
        "Both worlds generated with the same settings. The broken build spawns an endless frozen ocean — no terrain to build on anywhere.",
    },
    {
      id: "scrap",
      game: "Scrap Shift · 3D salvage",
      req: "“The A key must move the player left, and the D key must move the player right.”",
      quote: "a and d are inverted",
      note:
        "Same held keys on both versions: A, then D. In the broken build the controls are swapped, shoving the player the wrong way — straight into the wall. The next-turn fix strafes correctly.",
    },
  ];

  var grid = document.getElementById("repair-grid");
  if (grid) {
    grid.innerHTML = REPAIRS.map(function (r) {
      return (
        '<article class="repair" data-id="' + r.id + '" data-state="broken">' +
        '<div class="repair-head">' +
        '<div class="repair-game">' + r.game + "</div>" +
        '<div class="prompt-card"><strong>Requirement</strong>' + r.req + "</div>" +
        "</div>" +
        '<div class="seg" role="group" aria-label="Toggle broken or fixed version">' +
        '<button class="on-broken" data-v="broken">✗ Broken</button>' +
        '<button data-v="fixed">✓ Fixed</button>' +
        "</div>" +
        '<div class="repair-media">' +
        '<video src="assets/media/repairs/' + r.id + '-broken.mp4" muted playsinline loop preload="metadata"></video>' +
        '<span class="state-chip broken">requirement broken</span>' +
        "</div>" +
        '<p class="repair-note">' +
        r.note +
        (r.quote ? ' <span class="quote">User: “' + r.quote + '”</span>' : "") +
        "</p>" +
        '<div class="repair-links">' +
        '<a href="assets/games/' + r.id + '-broken/index.html" target="_blank" rel="noopener">Play broken ↗</a>' +
        '<a href="assets/games/' + r.id + '-fixed/index.html" target="_blank" rel="noopener">Play fixed ↗</a>' +
        "</div>" +
        "</article>"
      );
    }).join("");

    grid.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".seg button");
      if (!btn) return;
      var card = btn.closest(".repair");
      var v = btn.dataset.v;
      if (card.dataset.state === v) return;
      card.dataset.state = v;
      card.querySelectorAll(".seg button").forEach(function (b) {
        b.className = b.dataset.v === v ? "on-" + v : "";
      });
      var video = card.querySelector("video");
      video.src = "assets/media/repairs/" + card.dataset.id + "-" + v + ".mp4";
      video.play();
      var chip = card.querySelector(".state-chip");
      chip.className = "state-chip " + v;
      chip.textContent = v === "broken" ? "requirement broken" : "user-confirmed fix";
    });

    // ArenaPreferences battle tabs.
    var btabs = document.getElementById("battle-tabs");
    if (btabs) {
      var battles = document.querySelectorAll(".battle");
      battles.forEach(function (b, i) { b.hidden = i !== 0; });
      btabs.addEventListener("click", function (ev) {
        var btn = ev.target.closest(".tab");
        if (!btn) return;
        btabs.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === btn); });
        battles.forEach(function (b) {
          b.hidden = b.dataset.battle !== btn.dataset.battle;
          b.querySelectorAll("video").forEach(function (v) { b.hidden ? v.pause() : v.play(); });
        });
      });
    }

    // Tab selector: one example game at a time.
    var rtabs = document.getElementById("repair-tabs");
    if (rtabs) {
      rtabs.innerHTML = REPAIRS.map(function (r, i) {
        return '<button class="tab' + (i === 0 ? " active" : "") + '" data-id="' + r.id + '" role="tab">' + r.game.split(" ·")[0] + "</button>";
      }).join("");
      var cards = grid.querySelectorAll(".repair");
      cards.forEach(function (c, i) { c.hidden = i !== 0; });
      rtabs.addEventListener("click", function (ev) {
        var btn = ev.target.closest(".tab");
        if (!btn) return;
        rtabs.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === btn); });
        cards.forEach(function (c) {
          c.hidden = c.dataset.id !== btn.dataset.id;
          var v = c.querySelector("video");
          if (!c.hidden) v.play(); else v.pause();
        });
      });
    }

    // Play repair videos when visible.
    var vids = grid.querySelectorAll("video");
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.play();
        else e.target.pause();
      });
    }, { threshold: 0.3 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  /* ── Result charts (dot strips, values and colors from the paper) ── */
  var C_GRAY = "#8e8e8e", C_HEUR = "#e8a6be", C_ONESHOT = "#92c9b2", C_ITER = "#b9add8", C_PURPLE = "#af82de";
  var CHARTS = {
    pref: {
      min: 64, max: 73, unit: "%",
      series: [
        { key: "code", label: "Code", color: "#b8b8b8", labeled: true },
        { key: "cs", label: "Code + screenshot", color: "#6e6e6e" },
        { key: "heur", label: "Heuristic Computer-Use", color: C_HEUR },
        { key: "os", label: "One-Shot Computer-Use", color: C_ONESHOT },
        { key: "iter", label: "Iterative Computer-Use", color: C_ITER, labeled: true },
      ],
      rows: [
        { label: "LLM judge · Gemini 3 Flash", v: { code: 65.6, cs: 67.6, heur: 68.4, os: 68.3, iter: 69.1 } },
        { label: "LLM judge · GPT-5.6 Luna", v: { code: 68.3, cs: 66.6, heur: 67.2, os: 67.0, iter: 67.9 } },
        { label: "Reward model · full code", v: { code: 69.7, cs: 70.0, heur: 70.2, os: 70.2, iter: 70.8 } },
        { label: "Reward model · App.tsx", v: { code: 68.2, cs: 68.7, heur: 69.8, os: 70.0, iter: 70.2 } },
        { label: "Reward model · interaction only", v: { heur: 67.5, os: 67.8, iter: 69.0 } },
      ],
    },
    corr: {
      type: "xy", logX: true,
      xMin: 0.005, xMax: 1.0, yMin: 48, yMax: 74,
      xTicks: [0.01, 0.03, 0.1, 0.3, 1.0],
      xLabel: "Cost per app version, judge + computer-use (USD, log scale)",
      // Costs measured from amv2-phase1 run logs (full 222-version population,
      // project's own cost_rates.json); accuracy from the paper.
      series: [
        { label: "Code Agent-as-a-Judge", color: C_GRAY,
          pts: [
            { m: "Luna", x: 0.0075, y: 51.6, dy: 22 },
            { m: "Terra", x: 0.085, y: 59.6, dy: 22 },
            { m: "Sol", x: 0.155, y: 63.0, dy: 22 },
          ] },
        { label: "Interaction-as-a-Judge", color: C_PURPLE,
          pts: [
            { m: "Luna", x: 0.026, y: 65.2, dy: -12 },
            { m: "Terra", x: 0.270, y: 68.0, dy: -12 },
            { m: "Sol", x: 0.619, y: 71.1, dy: -12 },
          ] },
      ],
    },
    repair: {
      type: "line", step: true, min: 0, max: 100, unit: "%",
      xs: ["0", "1", "2", "3", "4", "5"],
      xLabel: "Repair iterations", yLabel: "Requirements fixed (%)",
      labelIdx: [1, 5],
      series: [
        { label: "Code Agent-as-a-Judge", color: C_GRAY, vals: [0, 49.8, 54.0, 55.0, 55.2, 55.4] },
        { label: "Interaction-as-a-Judge", color: C_PURPLE, vals: [0, 63.5, 72.5, 73.8, 74.6, 75.5] },
      ],
    },
    train: {
      type: "bars", min: 0, max: 8, unit: "pp",
      yLabel: "Win-rate gain over base model (pp)",
      bars: [
        { label: "Code reward model", color: C_GRAY, val: 6.14 },
        { label: "Interaction reward model", color: C_PURPLE, val: 6.72 },
      ],
    },
  };

  function renderStrip(el, spec) {
    var W = 760, ROW = 46, PAD_L = 250, PAD_R = 54, TOP = 14, BOT = 30;
    var H = TOP + spec.rows.length * ROW + BOT;
    var x = function (v) {
      return PAD_L + ((v - spec.min) / (spec.max - spec.min)) * (W - PAD_L - PAD_R);
    };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">';
    var step = (spec.max - spec.min) >= 30 ? 10 : (spec.max - spec.min) >= 12 ? 5 : 2;
    for (var t = Math.ceil(spec.min / step) * step; t <= spec.max; t += step) {
      s += '<line x1="' + x(t) + '" y1="' + TOP + '" x2="' + x(t) + '" y2="' + (H - BOT) + '" stroke="var(--rule)" stroke-width="1"/>';
      s += '<text x="' + x(t) + '" y="' + (H - 10) + '" text-anchor="middle" class="ctick">' + t + spec.unit + "</text>";
    }
    spec.rows.forEach(function (r, i) {
      var cy = TOP + i * ROW + ROW / 2;
      s += '<text x="0" y="' + (cy + 4) + '" class="clabel">' + r.label + "</text>";
      var vals = spec.series.filter(function (sr) { return r.v[sr.key] != null; });
      var xs = vals.map(function (sr) { return x(r.v[sr.key]); });
      if (xs.length > 1) {
        s += '<line x1="' + Math.min.apply(null, xs) + '" y1="' + cy + '" x2="' + Math.max.apply(null, xs) + '" y2="' + cy + '" stroke="var(--rule-strong)" stroke-width="2"/>';
      }
      var lastLabelX = -1e9;
      vals.forEach(function (sr) {
        var v = r.v[sr.key], cx = x(v);
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + sr.color + '" stroke="var(--bg-card)" stroke-width="2"><title>' + sr.label + ": " + v + spec.unit + "</title></circle>";
        if (sr.labeled) {
          // alternate below when labels would collide
          var below = cx - lastLabelX < 44 && lastLabelX > -1e8;
          var isLast = sr === spec.series[spec.series.length - 1];
          var txt = v.toFixed(1) + (isLast && r.note ? " (" + r.note + ")" : "");
          s += '<text x="' + cx + '" y="' + (below ? cy + 24 : cy - 12) + '" text-anchor="middle" class="cval' + (sr.color !== C_GRAY ? " cval-b" : "") + '">' + txt + "</text>";
          if (!below) lastLabelX = cx;
        }
      });
    });
    s += "</svg>";
    el.innerHTML =
      '<div class="clegend">' +
      spec.series.map(function (sr) {
        return "<span><i style=\"background:" + sr.color + '"></i>' + sr.label + "</span>";
      }).join("") +
      "</div>" + s;
  }

  function legendHTML(entries) {
    return '<div class="clegend">' + entries.map(function (e) {
      var lbl = e.label.indexOf("Interaction-as-a-Judge") >= 0 ? "<strong>" + e.label + "</strong>" : e.label;
      return "<span><i style=\"background:" + e.color + '"></i>' + lbl + "</span>";
    }).join("") + "</div>";
  }

  function renderLine(el, spec) {
    var W = 680, H = 300, PAD_L = 56, PAD_R = 60, TOP = 16, BOT = 44;
    var n = spec.xs.length;
    var x = function (i) { return PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R); };
    var y = function (v) { return TOP + (1 - (v - spec.min) / (spec.max - spec.min)) * (H - TOP - BOT); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;height:auto;display:block;margin:0 auto">';
    var step = (spec.max - spec.min) / 4;
    for (var g = spec.min; g <= spec.max; g += step) {
      s += '<line x1="' + PAD_L + '" y1="' + y(g) + '" x2="' + (W - PAD_R) + '" y2="' + y(g) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(g) + 3) + '" text-anchor="end" class="ctick">' + Math.round(g) + spec.unit + "</text>";
    }
    spec.xs.forEach(function (lx, i) {
      s += '<text x="' + x(i) + '" y="' + (H - 22) + '" text-anchor="middle" class="ctick ctick-x">' + lx + "</text>";
    });
    if (spec.xLabel) s += '<text x="' + (PAD_L + (W - PAD_L - PAD_R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="ctick">' + spec.xLabel + "</text>";
    spec.series.forEach(function (sr) {
      var pts = [];
      sr.vals.forEach(function (v, i) {
        if (spec.step && i > 0) pts.push([x(i), y(sr.vals[i - 1])]);
        pts.push([x(i), y(v)]);
      });
      s += '<polyline fill="none" stroke="' + sr.color + '" stroke-width="2.5" points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '"/>';
      sr.vals.forEach(function (v, i) {
        s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="5.5" fill="' + sr.color + '" stroke="var(--bg-card)" stroke-width="2"><title>' + sr.label + " · " + spec.xs[i] + ": " + v + spec.unit + "</title></circle>";
        var lbl = spec.labelIdx ? spec.labelIdx.indexOf(i) >= 0 : true;
        if (lbl && v > 0) {
          var isTop = sr === spec.series[spec.series.length - 1];
          var lastPt = i === sr.vals.length - 1;
          var tx = lastPt ? x(i) + 10 : x(i);
          var anchor = lastPt ? "start" : "middle";
          s += '<text x="' + tx + '" y="' + (y(v) + (isTop ? -11 : 20)) + '" text-anchor="' + anchor + '" class="cval' + (isTop ? " cval-b" : "") + '">' + v.toFixed(1) + "</text>";
        }
      });
    });
    s += "</svg>";
    el.innerHTML = legendHTML(spec.series) + s;
  }

  function renderFrontier(el, spec) {
    // Harness-tax-style frontier: one line per judge/model, labeled at its end;
    // dots colored by condition (legend above).
    var W = 760, H = 380, PAD_L = 50, PAD_R = 190, TOP = 16, BOT = 52;
    var x = function (v) { return PAD_L + ((v - spec.xMin) / (spec.xMax - spec.xMin)) * (W - PAD_L - PAD_R); };
    var y = function (v) { return TOP + (1 - (v - spec.yMin) / (spec.yMax - spec.yMin)) * (H - TOP - BOT); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">';
    for (var gy = Math.ceil(spec.yMin); gy <= spec.yMax; gy += 1) {
      s += '<line x1="' + PAD_L + '" y1="' + y(gy) + '" x2="' + (W - PAD_R + 20) + '" y2="' + y(gy) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(gy) + 3) + '" text-anchor="end" class="ctick">' + gy + "%</text>";
    }
    for (var gx = 0; gx <= spec.xMax + 1e-9; gx += 0.02) {
      s += '<text x="' + x(gx) + '" y="' + (H - 32) + '" text-anchor="middle" class="ctick">$' + gx.toFixed(2) + "</text>";
    }
    s += '<text x="' + (PAD_L + (W - PAD_L - PAD_R) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="ctick">' + spec.xLabel + "</text>";
    spec.series.forEach(function (sr) {
      var pts = spec.conditions.filter(function (c) { return sr.v[c.key] != null; });
      s += '<polyline fill="none" stroke="var(--rule-strong)" stroke-width="2" points="' +
        pts.map(function (c) { return x(c.x) + "," + y(sr.v[c.key]); }).join(" ") + '"/>';
      pts.forEach(function (c) {
        s += '<circle cx="' + x(c.x) + '" cy="' + y(sr.v[c.key]) + '" r="6.5" fill="' + c.color +
          '" stroke="var(--bg-card)" stroke-width="2"><title>' + sr.label + " · " + c.label + ": " +
          sr.v[c.key] + "% at $" + c.x.toFixed(3) + "/battle</title></circle>";
      });
      var last = pts[pts.length - 1];
      s += '<text x="' + (x(last.x) + 14) + '" y="' + (y(sr.v[last.key]) + 4 + (sr.ldy || 0)) +
        '" text-anchor="start" class="clabel" style="font-size:12.5px">' + sr.label + "</text>";
    });
    s += "</svg>";
    el.innerHTML = legendHTML(spec.conditions) + s;
  }

  function renderScatter(el, spec) {
    var W = 680, H = 340, PAD_L = 58, PAD_R = 24, TOP = 16, BOT = 52;
    var x = function (v) { return PAD_L + ((v - spec.xMin) / (spec.xMax - spec.xMin)) * (W - PAD_L - PAD_R); };
    var y = function (v) { return TOP + (1 - (v - spec.yMin) / (spec.yMax - spec.yMin)) * (H - TOP - BOT); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;height:auto;display:block;margin:0 auto">';
    for (var gy = 65; gy <= spec.yMax; gy += 1) {
      s += '<line x1="' + PAD_L + '" y1="' + y(gy) + '" x2="' + (W - PAD_R) + '" y2="' + y(gy) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(gy) + 3) + '" text-anchor="end" class="ctick">' + gy + "%</text>";
    }
    for (var gx = Math.ceil(spec.xMin / 0.02) * 0.02; gx <= spec.xMax + 1e-9; gx += 0.02) {
      s += '<line x1="' + x(gx) + '" y1="' + TOP + '" x2="' + x(gx) + '" y2="' + (H - BOT) + '" stroke="var(--rule)"/>';
      s += '<text x="' + x(gx) + '" y="' + (H - 32) + '" text-anchor="middle" class="ctick">$' + gx.toFixed(2) + "</text>";
    }
    s += '<text x="' + (PAD_L + (W - PAD_L - PAD_R) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="ctick">' + spec.xLabel + "</text>";
    function drawSeries(points, hollow, withNames) {
      var pts = points.slice().sort(function (a, b) { return a.x - b.x; });
      s += '<polyline fill="none" stroke="var(--rule-strong)" stroke-width="2"' +
        (hollow ? ' stroke-dasharray="3 5" opacity=".7"' : ' stroke-dasharray="5 5"') +
        ' points="' + pts.map(function (p) { return x(p.x) + "," + y(p.y); }).join(" ") + '"/>';
      pts.forEach(function (p) {
        var lx = x(p.x) + (p.dx || 0), anchor = p.anchor || "middle";
        s += '<circle cx="' + x(p.x) + '" cy="' + y(p.y) + '" r="' + (hollow ? 6.5 : 8) + '" fill="' +
          (hollow ? "var(--bg-card)" : p.color) + '" stroke="' + (hollow ? p.color : "var(--bg-card)") +
          '" stroke-width="' + (hollow ? 2.5 : 2) + '"><title>' + p.label + ": " + p.y + "% at $" + p.x.toFixed(3) + "/battle</title></circle>";
        if (withNames) {
          s += '<text x="' + lx + '" y="' + (y(p.y) + (p.dy || -14)) + '" text-anchor="' + anchor + '" class="cval cval-b">' + p.label + "</text>";
          s += '<text x="' + lx + '" y="' + (y(p.y) + (p.dy || -14) + ((p.dy || -14) > 0 ? 13 : -12)) + '" text-anchor="' + anchor + '" class="cval">' + p.y.toFixed(1) + "%</text>";
        } else {
          s += '<text x="' + lx + '" y="' + (y(p.y) + (p.dy || -12)) + '" text-anchor="' + anchor + '" class="cval">' + p.y.toFixed(1) + "</text>";
        }
      });
    }
    if (spec.points2) drawSeries(spec.points2, true, false);
    drawSeries(spec.points, false, true);
    s += "</svg>";
    var legend = spec.seriesNames
      ? '<div class="clegend"><span><i style="background:var(--ink-soft)"></i>' + spec.seriesNames[0] +
        '</span><span><i style="background:var(--bg-card);border:2px solid var(--ink-soft)"></i>' + spec.seriesNames[1] + "</span></div>"
      : "";
    el.innerHTML = legend + s;
  }

  function renderXY(el, spec) {
    var W = 680, H = 340, PAD_L = 50, PAD_R = 30, TOP = 16, BOT = 52;
    var tx = function (v) { return spec.logX ? Math.log10(v) : v; };
    var x = function (v) { return PAD_L + ((tx(v) - tx(spec.xMin)) / (tx(spec.xMax) - tx(spec.xMin))) * (W - PAD_L - PAD_R); };
    var y = function (v) { return TOP + (1 - (v - spec.yMin) / (spec.yMax - spec.yMin)) * (H - TOP - BOT); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">';
    for (var gy = Math.ceil(spec.yMin / 5) * 5; gy <= spec.yMax; gy += 5) {
      s += '<line x1="' + PAD_L + '" y1="' + y(gy) + '" x2="' + (W - PAD_R) + '" y2="' + y(gy) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(gy) + 3) + '" text-anchor="end" class="ctick">' + gy + "%</text>";
    }
    spec.xTicks.forEach(function (t) {
      s += '<line x1="' + x(t) + '" y1="' + TOP + '" x2="' + x(t) + '" y2="' + (H - BOT) + '" stroke="var(--rule)"/>';
      s += '<text x="' + x(t) + '" y="' + (H - 32) + '" text-anchor="middle" class="ctick">$' + (t < 0.1 ? t.toFixed(2) : t.toFixed(1)) + "</text>";
    });
    s += '<text x="' + (PAD_L + (W - PAD_L - PAD_R) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="ctick">' + spec.xLabel + "</text>";
    spec.series.forEach(function (sr) {
      s += '<polyline fill="none" stroke="' + sr.color + '" stroke-width="2.5" points="' +
        sr.pts.map(function (p) { return x(p.x) + "," + y(p.y); }).join(" ") + '"/>';
      sr.pts.forEach(function (p) {
        s += '<circle cx="' + x(p.x) + '" cy="' + y(p.y) + '" r="6.5" fill="' + sr.color + '" stroke="var(--bg-card)" stroke-width="2"><title>' + sr.label + " · GPT-5.6 " + p.m + ": " + p.y + "% at $" + p.x.toFixed(3) + "/version</title></circle>";
        s += '<text x="' + x(p.x) + '" y="' + (y(p.y) + p.dy) + '" text-anchor="middle" class="cval' + (sr.color === C_PURPLE ? " cval-b" : "") + '">' + p.m + " · " + p.y.toFixed(1) + "</text>";
      });
    });
    s += "</svg>";
    el.innerHTML = legendHTML(spec.series) + s;
  }

  function renderBars(el, spec) {
    var W = 420, H = 260, PAD_L = 46, TOP = 18, BOT = 50, BW = 84, GAP = 70;
    var y = function (v) { return TOP + (1 - (v - spec.min) / (spec.max - spec.min)) * (H - TOP - BOT); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:420px;height:auto;display:block;margin:0 auto">';
    for (var g = spec.min; g <= spec.max; g += 2) {
      s += '<line x1="' + PAD_L + '" y1="' + y(g) + '" x2="' + (W - 10) + '" y2="' + y(g) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(g) + 3) + '" text-anchor="end" class="ctick">' + g + "</text>";
    }
    var x0 = PAD_L + 50;
    spec.bars.forEach(function (b, i) {
      var bx = x0 + i * (BW + GAP);
      s += '<rect x="' + bx + '" y="' + y(b.val) + '" width="' + BW + '" height="' + (y(spec.min) - y(b.val)) + '" rx="4" fill="' + b.color + '"><title>' + b.label + ": +" + b.val + spec.unit + "</title></rect>";
      s += '<text x="' + (bx + BW / 2) + '" y="' + (y(b.val) - 8) + '" text-anchor="middle" class="cval cval-b">+' + b.val.toFixed(2) + "</text>";
      s += '<text x="' + (bx + BW / 2) + '" y="' + (H - 28) + '" text-anchor="middle" class="clabel" style="font-size:12px">' + b.label.split(" ")[0] + " RM</text>";
    });
    s += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" class="ctick">' + spec.yLabel + "</text>";
    s += "</svg>";
    el.innerHTML = legendHTML(spec.bars) + s;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateChart(el) {
    // Lines draw themselves in; dots and labels pop in sequence; bars grow.
    el.querySelectorAll("polyline").forEach(function (pl, i) {
      var len = pl.getTotalLength();
      pl.style.strokeDasharray = len;
      pl.style.strokeDashoffset = len;
      pl.getBoundingClientRect(); // flush
      pl.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1) " + (i * 0.35) + "s";
      pl.style.strokeDashoffset = "0";
    });
    el.querySelectorAll("circle").forEach(function (c, i) {
      var r = c.getAttribute("r");
      c.setAttribute("data-r", r);
      c.setAttribute("r", 0);
      setTimeout(function () {
        c.style.transition = "r .45s cubic-bezier(.34,1.56,.64,1)";
        c.setAttribute("r", r);
      }, 250 + i * 90);
    });
    el.querySelectorAll("text.cval").forEach(function (t, i) {
      t.style.opacity = 0;
      setTimeout(function () {
        t.style.transition = "opacity .5s ease";
        t.style.opacity = 1;
      }, 600 + i * 110);
    });
    el.querySelectorAll("rect[rx]").forEach(function (b, i) {
      var h = parseFloat(b.getAttribute("height"));
      var y = parseFloat(b.getAttribute("y"));
      b.setAttribute("height", 0);
      b.setAttribute("y", y + h);
      setTimeout(function () {
        b.style.transition = "height .9s cubic-bezier(.4,0,.2,1), y .9s cubic-bezier(.4,0,.2,1)";
        b.setAttribute("height", h);
        b.setAttribute("y", y);
      }, 200 + i * 150);
    });
  }

  var chartIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting || e.target.dataset.animated) return;
      e.target.dataset.animated = "1";
      animateChart(e.target);
      chartIO.unobserve(e.target);
    });
  }, { threshold: 0.35 });

  // RL training curves, extracted from the paper figure's vector data.
  function renderCurves(el, panel, opts) {
    var W = 440, H = 300, PAD_L = 52, PAD_R = 12, TOP = 14, BOT = 46;
    var x = function (v) { return PAD_L + (v / 35) * (W - PAD_L - PAD_R); };
    var y = function (v) { return TOP + (1 - (v - opts.yMin) / (opts.yMax - opts.yMin)) * (H - TOP - BOT); };
    var SERIES = [
      { key: "code_rm", label: "Code reward model", color: C_GRAY },
      { key: "inter_rm", label: "Interaction reward model", color: C_PURPLE },
    ];
    var s = '<div class="pair-title" style="margin-top:0">' + opts.title + "</div>";
    s += '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">';
    for (var gy = opts.yMin; gy <= opts.yMax + 1e-9; gy += opts.yStep) {
      s += '<line x1="' + PAD_L + '" y1="' + y(gy) + '" x2="' + (W - PAD_R) + '" y2="' + y(gy) + '" stroke="var(--rule)"/>';
      s += '<text x="' + (PAD_L - 8) + '" y="' + (y(gy) + 3) + '" text-anchor="end" class="ctick">' + opts.yFmt(gy) + "</text>";
    }
    for (var gx = 0; gx <= 35; gx += 5) {
      s += '<text x="' + x(gx) + '" y="' + (H - 26) + '" text-anchor="middle" class="ctick">' + gx + "</text>";
    }
    s += '<text x="' + (PAD_L + (W - PAD_L - PAD_R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" class="ctick">Training step</text>';
    SERIES.forEach(function (sr) {
      var pts = panel[sr.key];
      if (!pts) return;
      s += '<polyline fill="none" stroke="' + sr.color + '" stroke-width="2.5"' +
        (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : "") + ' points="' +
        pts.map(function (p) { return x(p[0]) + "," + y(Math.max(opts.yMin, Math.min(opts.yMax, p[1]))); }).join(" ") + '"/>';
    });
    s += "</svg>";
    el.innerHTML = legendHTML(SERIES) + s;
  }

  var duoA = document.querySelector('[data-chart="train-builds"]');
  var duoB = document.querySelector('[data-chart="train-chars"]');
  if (duoA && duoB) {
    fetch("assets/data/training_curves.json").then(function (r) { return r.json(); }).then(function (d) {
      renderCurves(duoA, d.builds, { title: "Successful builds", yMin: 50, yMax: 100, yStep: 10, yFmt: function (v) { return v + "%"; } });
      renderCurves(duoB, d.chars, { title: "Mean code characters", yMin: 0, yMax: 70000, yStep: 15000, yFmt: function (v) { return (v / 1000) + "k"; } });
      if (!reducedMotion) { chartIO.observe(duoA); chartIO.observe(duoB); }
    });
  }

  document.querySelectorAll(".chart[data-chart]").forEach(function (el) {
    var spec = CHARTS[el.dataset.chart];
    if (!spec) return;
    if (spec.type === "line") renderLine(el, spec);
    else if (spec.type === "bars") renderBars(el, spec);
    else if (spec.type === "scatter") renderScatter(el, spec);
    else if (spec.type === "frontier") renderFrontier(el, spec);
    else if (spec.type === "xy") renderXY(el, spec);
    else renderStrip(el, spec);
    if (!reducedMotion) chartIO.observe(el);
  });

  /* ── Count-up stats ───────────────────────────────────────── */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || e.target.dataset.done) return;
        e.target.dataset.done = "1";
        var target = parseFloat(e.target.dataset.count);
        var t0 = null;
        var dur = 900;
        function tick(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / dur);
          k = 1 - Math.pow(1 - k, 3);
          e.target.textContent = (target * k).toFixed(1);
          if (k < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ── Scroll reveal ────────────────────────────────────────── */
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        ro.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(function (el) { ro.observe(el); });
})();
