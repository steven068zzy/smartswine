/* Smart Swine · site.js
   Progressive enhancement only: every page reads in full with JS off.
   No dependencies. The scroll-scrubbed sequences are driven by one shared
   requestAnimationFrame loop that only runs while something is moving. */
(function () {
  "use strict";

  var w = window, d = document, root = d.documentElement;
  var mq = function (q) { return w.matchMedia(q).matches; };
  var motionOK = !mq("(prefers-reduced-motion: reduce)");
  var desktop = mq("(min-width: 900px)");
  w.__ssReady = true;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* smoothstep between a and b */
  function ramp(a, b, v) { var t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); }

  /* ---------- top bar ----------
     Dismissing sticks for the session. The head script hides the bar before
     first paint on later pages, so nothing jumps. */
  var bar = $("#topbar");
  if (bar) {
    var x = $(".topbar-x", bar);
    if (x) x.addEventListener("click", function () {
      root.classList.add("no-topbar");
      try { sessionStorage.setItem("ss-topbar-dismissed", "1"); } catch (e) {}
      kick();
    });
  }

  /* ---------- nav ---------- */
  var nav = $("#nav");
  function navState() {
    if (nav) nav.classList.toggle("is-stuck", nav.getBoundingClientRect().top <= 0 && w.scrollY > 4);
  }

  var drop = $(".nav-drop");
  if (drop) {
    var dbtn = $(".nav-drop-btn", drop);
    var setDrop = function (open) {
      drop.classList.toggle("open", open);
      dbtn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    dbtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setDrop(!drop.classList.contains("open"));
    });
    d.addEventListener("click", function (e) { if (!drop.contains(e.target)) setDrop(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrop(false); } });
  }

  var burger = $(".nav-burger");
  var menu = $("#mobileMenu");
  if (burger && menu) {
    var setMenu = function (open) {
      /* the bar above the nav may or may not have scrolled away, so the
         panel hangs from wherever the nav's lower edge actually is */
      if (open) menu.style.top = Math.round(nav.getBoundingClientRect().bottom) + "px";
      d.body.classList.toggle("menu-open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    };
    burger.addEventListener("click", function () { setMenu(!d.body.classList.contains("menu-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    w.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    w.addEventListener("resize", function () { if (w.innerWidth > 980) setMenu(false); });
  }

  /* ---------- scroll reveals ---------- */
  var rv = $$(".rv");
  if (rv.length) {
    /* siblings that enter together arrive as one staggered group */
    rv.forEach(function (el) {
      var i = 0, p = el.previousElementSibling;
      while (p && i < 5) { if (p.classList.contains("rv")) i++; p = p.previousElementSibling; }
      if (i) el.style.setProperty("--i", i);
    });
    if (!motionOK || !("IntersectionObserver" in w)) {
      rv.forEach(function (el) { el.classList.add("in"); });
    } else {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
      rv.forEach(function (el) { rio.observe(el); });
    }
  }

  /* ---------- count-ups ----------
     The markup already holds the final figure, so with JS off or motion
     reduced the number is simply there. */
  var counts = $$("[data-count]");
  if (counts.length && motionOK && "IntersectionObserver" in w) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var pre = el.getAttribute("data-prefix") || "";
      var suf = el.getAttribute("data-suffix") || "";
      var fmt = function (v) {
        return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      };
      var t0 = null, dur = 1400;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = clamp01((t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + fmt(target * e) + suf;
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = pre + fmt(target) + suf;
      }
      el.textContent = pre + fmt(0) + suf;
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.2 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- films ----------
     Autoplay lives in the HTML so the clips run without JS. They are muted,
     looping and never show controls, under reduced motion too (client rule).
     JS only pauses them while they are offscreen. */
  var films = $$("video.film");
  if (films.length && "IntersectionObserver" in w) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var p = e.target.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          e.target.pause();
        }
      });
    }, { threshold: 0.15 });
    films.forEach(function (v) { fio.observe(v); });
  }

  /* ---------- posture gallery ----------
     Drives the SPC-01 curtain rule table and the case study's real-frame
     classifier gallery from the same component. Rows stay clickable with no
     motion; auto-advance is the only part gated on motionOK. A row carrying
     data-cap supplies its own caption, rows without it fall back to the
     curtain-rule list below. */
  var pgal = $("#pgal");
  if (pgal) {
    var prows = $$(".prow", pgal);
    var pimgs = $$(".pstack img", pgal);
    var pcap = $("#pcap");
    var pcaps = [
      "Standing: her next move is unreadable, so both curtains stay down and the litter is kept out on the strips. Concept render.",
      "Sternal Lying, Right: she can roll only onto the right strip, so the right curtain holds it closed while the left curtain lifts the safe strip open. Concept render.",
      "Lateral Lying, Right: terminal posture. No crushing threat anywhere in the crate, both curtains lift and nursing begins from the left strip. Concept render.",
      "Sternal Lying, Left: the mirror case, read from the same signals. The left curtain holds and the right curtain lifts. Concept render.",
      "Lateral Lying, Left: terminal posture, mirrored. Piglets are under no crushing threat and traffic is free on both strips. Concept render."
    ];
    var pidx = 0, ptimer = null, phold = 0;
    var pshow = function (i) {
      pidx = i;
      prows.forEach(function (r, k) {
        r.classList.toggle("on", k === i);
        r.setAttribute("aria-pressed", k === i ? "true" : "false");
      });
      pimgs.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      if (pcap) pcap.textContent = prows[i].getAttribute("data-cap") || pcaps[i] || "";
    };
    prows.forEach(function (r, k) {
      var hold = function () { phold = Date.now() + 14000; pshow(k); };   /* a person is reading: hold the reel */
      r.addEventListener("click", hold);
      r.addEventListener("focus", hold);
    });
    pshow(0);
    if (motionOK && "IntersectionObserver" in w) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !ptimer) {
            ptimer = setInterval(function () {
              if (Date.now() < phold) return;
              pshow((pidx + 1) % prows.length);
            }, 3800);
          } else if (!e.isIntersecting && ptimer) {
            clearInterval(ptimer);
            ptimer = null;
          }
        });
      }, { threshold: 0.25 }).observe(pgal);
    }
  }

  /* ---------- forms that compose an email ----------
     The site has no backend and sends nothing anywhere. A form collects the
     details, opens the visitor's own mail app with them filled in, and
     leaves a copyable version on the page in case no mail app is set up. */
  $$("form[data-mailto]").forEach(function (f) {
    var done = $(".form-done", f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = ["Hi Smart Swine team,", ""], key = "";
      $$("[name]", f).forEach(function (el) {
        var v = (el.value || "").trim();
        if (el.hasAttribute("data-key")) key = v;
        if (v) lines.push((el.getAttribute("data-label") || el.name) + ": " + v);
      });
      var closing = f.getAttribute("data-closing");
      if (closing) lines.push("", closing);
      var body = lines.join("\n");
      var subject = (f.getAttribute("data-subject") || "Smart Swine").replace("{key}", key || "our farm");
      var to = f.getAttribute("data-mailto");
      if (done) {
        $("pre", done).textContent = "To: " + to + "\nSubject: " + subject + "\n\n" + body;
        done.classList.add("on");
      }
      w.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
    var copy = $("[data-copy]", f);
    if (copy) copy.addEventListener("click", function () {
      var txt = $("pre", done).textContent;
      var ok = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy the message"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () {});
    });
  });

  /* ---------- scroll scrub driver ----------
     Each stage is a tall block with a sticky child. progress runs 0 → 1
     from the moment the child pins under the nav until it lets go. The
     value is eased toward its target so a wheel flick lands softly. */
  var scrubs = [], ticking = false;
  function navH() { return nav ? nav.offsetHeight : 0; }
  function progressOf(el) {
    var r = el.getBoundingClientRect();
    var top = navH();
    var total = r.height - (w.innerHeight - top);
    if (total <= 0) return 0;
    return clamp01((top - r.top) / total);
  }
  function tick() {
    var moving = false;
    for (var i = 0; i < scrubs.length; i++) {
      var s = scrubs[i];
      var target = progressOf(s.el);
      if (s.cur < 0) s.cur = target;
      var delta = target - s.cur;
      if (Math.abs(delta) > 0.0006) { s.cur += delta * 0.2; moving = true; }
      else s.cur = target;
      s.fn(s.cur);
    }
    if (moving) requestAnimationFrame(tick);
    else ticking = false;
  }
  function kick() {
    navState();
    if (!ticking && scrubs.length) { ticking = true; requestAnimationFrame(tick); }
  }
  function addScrub(el, fn) { scrubs.push({ el: el, fn: fn, cur: -1 }); kick(); }
  w.addEventListener("scroll", kick, { passive: true });
  w.addEventListener("resize", kick, { passive: true });
  navState();

  /* ---------- image-sequence scrubber ----------
     Shared by every sequence on the site. Frame 0 loads first and the
     canvas only takes over once it has decoded, so a missing or slow
     sequence leaves the static fallback image untouched. */
  function Sequence(canvas, count, srcFn) {
    this.canvas = canvas;
    this.count = count;
    this.srcFn = srcFn;
    this.imgs = new Array(count);
    this.lastDrawn = -1;
    this.want = -1;            /* the frame the scrub last asked for */
    this.rect = null;          /* where the frame's pixels actually landed */
    this.size = "";
  }
  Sequence.prototype.nearest = function (i) {
    if (this.imgs[i]) return i;
    for (var k = 1; k < this.count; k++) {
      if (this.imgs[i - k]) return i - k;
      if (this.imgs[i + k]) return i + k;
    }
    return -1;
  };
  Sequence.prototype.draw = function (i) {
    this.want = i;
    var k = this.nearest(i);
    if (k < 0 || !this.canvas) return;
    var dpr = Math.min(2, w.devicePixelRatio || 1);
    var cw = Math.round(this.canvas.clientWidth * dpr);
    var ch = Math.round(this.canvas.clientHeight * dpr);
    if (!cw || !ch) return;
    var size = cw + "x" + ch;
    if (k === this.lastDrawn && size === this.size) return;   /* nothing changed */
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    this.size = size;
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);
    var img = this.imgs[k];
    var s = Math.min(cw / img.width, ch / img.height);
    var dw = img.width * s, dh = img.height * s;
    var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    this.lastDrawn = k;
    /* CSS px relative to the canvas box: what the labels anchor against */
    this.rect = { x: dx / dpr, y: dy / dpr, w: dw / dpr, h: dh / dpr };
  };
  Sequence.prototype.loadRest = function () {
    var self = this, next = 0, inFlight = 0, MAXPAR = 6;
    function pump() {
      while (inFlight < MAXPAR && next < self.count) {
        (function (i) {
          if (self.imgs[i]) return;
          inFlight++;
          var im = new Image();
          im.onload = function () {
            self.imgs[i] = im;
            inFlight--;
            /* Refresh ONLY when this image improves the frame the scrub is
               asking for. Frames load in order from 0, so drawing each one
               as it arrived made the sequence play itself during loading. */
            if (self.want >= 0 && self.nearest(self.want) !== self.lastDrawn) self.draw(self.want);
            pump();
          };
          im.onerror = function () { inFlight--; pump(); };
          im.src = self.srcFn(i);
        })(next++);
      }
    }
    pump();
  };
  Sequence.prototype.start = function (onReady) {
    var self = this;
    var first = new Image();
    first.onload = function () {
      self.imgs[0] = first;
      onReady();
      self.draw(0);
      self.loadRest();
    };
    /* onerror: the sequence is missing, the static fallback simply stays */
    first.src = this.srcFn(0);
  };
  function pad3(i) { return String(i).padStart(3, "0"); }

  var canScrub = motionOK && desktop;

  /* two text beats crossfading over a pinned hero */
  function beatFn(stage, a, b) {
    var b1 = $(".beat-1", stage), b2 = $(".beat-2", stage), cue = $(".phero-cue", stage);
    function set(el, o, y) {
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
      el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    }
    return function (p) {
      var out1 = ramp(a[0], a[1], p);
      var in2 = ramp(b[0], b[1], p), out2 = ramp(b[2], b[3], p);
      set(b1, 1 - out1, -36 * out1);
      set(b2, in2 * (1 - out2), 36 * (1 - in2));
      if (cue) cue.style.opacity = (1 - ramp(0.02, 0.08, p)).toFixed(3);
    };
  }

  /* ---------- SPM-01 hero: the turntable ---------- */
  var turnCanvas = $("#turnCanvas"), hero = $("#hero");
  if (canScrub && turnCanvas && hero) {
    var TN = 96;
    var turn = new Sequence(turnCanvas, TN, function (i) { return "assets/seq/turn_" + pad3(i) + ".webp"; });
    turn.start(function () {
      hero.classList.add("is-scrub");
      var beats = beatFn(hero, [0.30, 0.40], [0.46, 0.56, 0.88, 0.96]);
      addScrub(hero, function (p) {
        var rot = Math.min(1, p / 0.92);
        turn.draw(Math.round(rot * (TN - 1)) % TN);
        beats(p);
      });
    });
  }

  /* ---------- SPC-01 hero: the curtain runs its travel as you scroll ----
     Frames sweep the drop, so scroll position IS hem position, and the
     gauge reads the same number. Travel completes at 62% of the pin: the
     last screen of scrub is a hold on the closed state, so the hem always
     lands before the page is allowed to move on. */
  var travCanvas = $("#travCanvas"), spcHero = $("#spcHero");
  if (canScrub && travCanvas && spcHero) {
    var VN = 48;
    var trav = new Sequence(travCanvas, VN, function (i) { return "assets/travel/trav_" + pad3(i) + ".webp"; });
    var gFill = $("#gaugeFill"), gTag = $("#gaugeTag"), gLast = "";
    trav.start(function () {
      spcHero.classList.add("is-scrub");
      var beats = beatFn(spcHero, [0.26, 0.36], [0.50, 0.60, 0.90, 0.98]);
      addScrub(spcHero, function (p) {
        var t = Math.min(1, p / 0.62);
        trav.draw(Math.round(t * (VN - 1)));
        if (gFill) gFill.style.transform = "scaleX(" + t.toFixed(4) + ")";
        var txt = t < 0.02 ? "Hem parked" : t > 0.985 ? "Closed · strip empty" : "Hem travel " + Math.round(t * 100) + "%";
        if (gTag && txt !== gLast) { gTag.textContent = txt; gLast = txt; }
        beats(p);
      });
    });
  }

  /* ---------- exploded view ----------
     Anchors are camera-projected percentages dumped straight out of the
     Blender build (ss_explode_seq.py → explode_anchors.json), so a label
     sits on its real part instead of a hand-guessed pixel. Only parts far
     enough apart to never collide are labelled; the full list sits below
     the stage. side: which way the leader runs. len: leader length in px.
     dx nudges the text block off a part it would otherwise cover; the
     leader stays on the anchor regardless. */
  var XANCHORS = [
    { x: 26.21, y: 41.11, side: "up",   len: 62,  dx: -74,  n: "01", t: "Power + data cable",  d: "Sealed gland · strain relief" },
    { x: 35.39, y: 40.10, side: "down", len: 96,  dx: 0,    n: "02", t: "Captive screws ×6",   d: "Bonded seal washers" },
    { x: 52.10, y: 40.48, side: "up",   len: 78,  dx: -136, n: "07", t: "Compute carrier",     d: "Raspberry Pi CM4 · M.2 storage" },
    { x: 55.91, y: 41.06, side: "down", len: 150, dx: -212, n: "08", t: "Camera I/O board",    d: "USB 3 hub · head connectors" },
    { x: 63.32, y: 26.33, side: "up",   len: 54,  dx: 0,    n: "12", t: "Quick-mount plate",   d: "Tool-free bracket interface" },
    { x: 79.46, y: 43.44, side: "up",   len: 92,  dx: -18,  n: "14", t: "Stereo depth module", d: "Sow posture · respiration" },
    { x: 62.19, y: 75.70, side: "down", len: 52,  dx: 0,    n: "16", t: "RGB camera + IR",     d: "Newborn · stillborn imaging" }
  ];
  var xstage = $("#xstage"), xcanvas = $("#xCanvas"), xlabels = $("#xLabels");
  if (canScrub && xstage && xcanvas && xlabels) {
    XANCHORS.forEach(function (a) {
      var el = d.createElement("span");
      el.className = "xlabel " + a.side;
      el.innerHTML = "<i class='lead' style='height:" + a.len + "px'></i><b>" + a.n + "</b>" + a.t + "<em>" + a.d + "</em>";
      a.el = el;
      a.lead = el.firstChild;
      xlabels.appendChild(el);
    });
    var placeX = function (seq) {
      if (!seq.rect) return;
      var r = seq.rect;
      var cb = xcanvas.getBoundingClientRect(), sb = xlabels.getBoundingClientRect();
      var ox = cb.left - sb.left + r.x, oy = cb.top - sb.top + r.y;
      XANCHORS.forEach(function (a) {
        var px = ox + r.w * a.x / 100, py = oy + r.h * a.y / 100;
        var b = a.el.getBoundingClientRect();
        /* the leader hangs off the label edge nearest the part, so the label
           body clears the anchor by exactly `len` either way */
        var top = a.side === "up" ? py - a.len - b.height : py + a.len;
        var left = px - 14 + a.dx;
        a.el.style.transform = "translate(" + Math.round(left) + "px," + Math.round(top) + "px)";
        a.lead.style.left = Math.round(px - left) + "px";
      });
    };
    var xseq = new Sequence(xcanvas, 48, function (i) { return "assets/explode/exp_" + pad3(i) + ".webp"; });
    xseq.start(function () {
      xstage.classList.add("is-scrub");
      addScrub(xstage, function (p) {
        /* fully apart by 82%; the tail is dwell time so the labels can be
           read without the parts still moving */
        var t = Math.min(1, p / 0.82);
        xseq.draw(Math.round(t * 47));
        if (t > 0.92) { xlabels.classList.add("on"); placeX(xseq); }
        else xlabels.classList.remove("on");
      });
    });
    w.addEventListener("resize", function () { if (xlabels.classList.contains("on")) placeX(xseq); }, { passive: true });
  }

  /* ---------- SPC-01 filmed control loop ----------
     A 72-frame photoreal sequence rendered by ss02_loop.py: standing with
     BOTH curtains down → settle sternal-right → SPM-01 names the side, the
     LEFT curtain lifts → the roll onto the kept-empty right strip → the
     right curtain lifts → the litter crosses from the left to nurse. The
     frame boundaries below mirror that script's own frame plan exactly, so
     the readout and captions stay truthful to what is on screen. FLANK
     naming: the label names the flank she rolls ONTO. */
  var loopCanvas = $("#loopCanvas"), loopStage = $("#loopStage");
  if (canScrub && loopCanvas && loopStage) {
    var LN = 72;
    var caps = $$("#loopCaps .sk-cap");
    var ticks = $$("#loopTicks i");
    var countEl = $("#loopCount");
    var stP = $("#stPosture"), stR = $("#stRisk"), stCL = $("#stCL"), stCR = $("#stCR");
    var set = function (el, txt, cls) {
      if (!el) return;
      if (el.textContent !== txt) el.textContent = txt;
      el.className = cls || "";
    };
    var loopStatus = function (i) {
      if (i < 10) {
        set(stP, "Standing"); set(stR, "Posture unresolved", "hot");
        set(stCL, "Down", "hot"); set(stCR, "Down", "hot");
      } else if (i < 24) {
        set(stP, "Sternal lying, right"); set(stR, "Roll right · ~3 s", "hot");
        set(stCL, "Down", "hot"); set(stCR, "Down", "hot");
      } else if (i < 34) {
        set(stP, "Sternal lying, right"); set(stR, "Roll right · ~3 s", "hot");
        set(stCL, i < 30 ? "Lifting" : "Up", "ok"); set(stCR, "Down", "hot");
      } else if (i < 40) {
        set(stP, "Sternal lying, right"); set(stR, "Roll right · ~3 s", "hot");
        set(stCL, "Up", "ok"); set(stCR, "Down", "hot");
      } else if (i < 50) {
        set(stP, "Rolling right"); set(stR, "Roll in progress", "hot");
        set(stCL, "Up", "ok"); set(stCR, "Down", "hot");
      } else if (i < 54) {
        set(stP, "Lateral lying, right"); set(stR, "None · terminal", "ok");
        set(stCL, "Up", "ok"); set(stCR, "Down", "hot");
      } else if (i < 62) {
        set(stP, "Lateral lying, right"); set(stR, "None · terminal", "ok");
        set(stCL, "Up", "ok"); set(stCR, "Lifting", "ok");
      } else if (i < 66) {
        set(stP, "Lateral lying, right"); set(stR, "None · terminal", "ok");
        set(stCL, "Up", "ok"); set(stCR, "Up", "ok");
      } else {
        set(stP, "Lateral lying · nursing"); set(stR, "None · terminal", "ok");
        set(stCL, "Up", "ok"); set(stCR, "Up", "ok");
      }
    };
    /* caption windows, same source frame ranges */
    var capT = [[0, 8], [8, 24], [24, 40], [40, 54], [54, 62], [62, 71]];
    var capIdx = -1;
    var loopCaption = function (i) {
      var k = 0;
      for (var n = 0; n < capT.length; n++) {
        if (i >= capT[n][0] && (i < capT[n][1] || n === capT.length - 1)) { k = n; break; }
      }
      if (k === capIdx) return;
      capIdx = k;
      caps.forEach(function (c, n) { c.classList.toggle("on", n === k); });
      ticks.forEach(function (t, n) { t.classList.toggle("on", n <= k); });
      if (countEl) countEl.textContent = "Step " + (k + 1) + " of " + caps.length;
    };
    var loopSeq = new Sequence(loopCanvas, LN, function (i) { return "assets/loop/loop_" + pad3(i) + ".webp"; });
    loopSeq.start(function () {
      loopStage.classList.add("is-scrub");
      loopCaption(0);
      addScrub(loopStage, function (p) {
        var i = Math.round(p * (LN - 1));
        loopSeq.draw(i);
        loopStatus(i);
        loopCaption(i);
      });
    });
  }
})();
