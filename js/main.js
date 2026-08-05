/* SMART SWINE — SPM-01 site interactions.
   Progressive enhancement: the page is fully readable with no JS at all.
   Everything below only decorates. */
(function () {
  "use strict";

  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 900px)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- offer bar ----------
     Pinned under the fixed nav, so it costs vertical space the layout has to
     know about. It carries two offers and stacks them below 900px, so the
     cost is not a constant: --promo-h is measured from the live element and
     every offset in the stylesheet reads from it. body.has-promo carries the
     offset; dismissing removes it and the choice sticks for the session. */
  var promo = document.getElementById("promo");
  if (promo) {
    var DISMISS = "ss-promo-dismissed";
    var gone = false;
    try { gone = sessionStorage.getItem(DISMISS) === "1"; } catch (e) {}
    if (gone) {
      promo.remove();
    } else {
      document.body.classList.add("has-promo");

      var lastH = 0;
      var measure = function () {
        var h = Math.round(promo.getBoundingClientRect().height);
        if (!h || h === lastH) return;
        lastH = h;
        document.documentElement.style.setProperty("--promo-h", h + "px");
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      };
      measure();
      if (window.ResizeObserver) new ResizeObserver(measure).observe(promo);
      else window.addEventListener("resize", measure);

      var x = promo.querySelector(".promo-x");
      if (x) x.addEventListener("click", function () {
        promo.remove();
        document.body.classList.remove("has-promo");
        document.documentElement.style.removeProperty("--promo-h");
        try { sessionStorage.setItem(DISMISS, "1"); } catch (e) {}
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      });
    }
  }

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector(".nav-burger");
  var mobileMenu = document.getElementById("mobileMenu");
  if (burger && mobileMenu) {
    var closeMenu = function () {
      document.body.classList.remove("menu-open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* any tap on a menu link closes the panel, same-page anchors included */
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- image-sequence scrubber ----------
     Shared by the hero turntable and the exploded view. Loads frame 0 first
     and only swaps the canvas in once it is decoded, so a missing or slow
     sequence leaves the static fallback image untouched. */
  function Sequence(canvas, count, srcFn) {
    this.canvas = canvas;
    this.count = count;
    this.srcFn = srcFn;
    this.imgs = new Array(count);
    this.lastDrawn = -1;
    this.want = -1;            /* the frame the scrub last asked for */
    this.rect = null;          /* where frame pixels actually landed */
  }

  Sequence.prototype.nearest = function (i) {
    if (this.imgs[i]) return i;
    for (var d = 1; d < this.count; d++) {
      if (this.imgs[i - d]) return i - d;
      if (this.imgs[i + d]) return i + d;
    }
    return -1;
  };

  Sequence.prototype.draw = function (i) {
    this.want = i;
    var k = this.nearest(i);
    if (k < 0 || !this.canvas) return;
    var ctx = this.canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = this.canvas.clientWidth * dpr;
    var h = this.canvas.clientHeight * dpr;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    var img = this.imgs[k];
    var s = Math.min(w / img.width, h / img.height);
    var dw = img.width * s, dh = img.height * s;
    var dx = (w - dw) / 2, dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    this.lastDrawn = k;
    /* CSS px, relative to the canvas box — what the labels anchor against */
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
            /* refresh ONLY when this image improves the frame the scrub
               is asking for. Never draw a frame just because it loaded —
               frames load in order from 0, so the old proximity check
               ratcheted lastDrawn forward and the sequence PLAYED ITSELF
               during loading (the hero curtain "came down on its own",
               user 2026-08-04). */
            if (self.want >= 0 && self.nearest(self.want) !== self.lastDrawn) {
              self.draw(self.want);
            }
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
      ScrollTrigger.refresh();
    };
    /* onerror: sequence missing — the static fallback stays, no harm done */
    first.src = this.srcFn(0);
  };

  /* ---------- hero turntable ---------- */
  var N = 96;
  var canvas = document.getElementById("turnCanvas");
  var hero = document.getElementById("hero");
  var ring = document.querySelector(".hero-ring circle");
  var turn = canvas && new Sequence(canvas, N, function (i) {
    return "assets/seq/turn_" + String(i).padStart(3, "0") + ".webp";
  });
  var drawFrame = function (i) { if (turn) turn.draw(i); };

  function initTurntable() {
    turn.start(function () {
      hero.classList.add("hero--scrub");
      buildHeroTimeline();
    });
  }

  function buildHeroTimeline() {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: function (self) {
          var rotP = Math.min(1, self.progress / 0.92);
          drawFrame(Math.round(rotP * (N - 1)) % N);
          if (ring) ring.style.strokeDashoffset = 100 - rotP * 100;
        }
      }
    });
    /* Two beats over ~90vh of scrub. A third beat here would give each one
       about a third of a wheel-flick to be read. */
    tl.to(".beat-1", { autoAlpha: 0, y: -46, duration: 0.10 }, 0.30)
      .fromTo(".beat-2", { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.10 }, 0.46)
      .to(".beat-2", { autoAlpha: 0, duration: 0.08 }, 0.88)
      .to(".hero-cue", { autoAlpha: 0, duration: 0.05 }, 0.08);
  }

  if (hasGSAP && motionOK && desktop && canvas) initTurntable();

  /* ---------- SPC-01 hero: the curtain runs its travel as you scroll ----
     Same Sequence machinery as the turntable, but the frames sweep the
     drop parameter instead of the camera, so scroll position IS hem
     position. The rail on the right is the same reading as a gauge.
     The travel completes at 62% of the pin (own 300vh height in the CSS):
     the final screen of scrub is a hold on the fully-closed state, so the
     hem always lands BEFORE the page is allowed to move on — at the old
     92% finish a normal flick unpinned the section mid-drop. */
  var TN = 48;
  var travCanvas = document.getElementById("travCanvas");
  var spcHero = document.getElementById("spcHero");
  var trav = travCanvas && new Sequence(travCanvas, TN, function (i) {
    return "assets/travel/trav_" + String(i).padStart(3, "0") + ".webp";
  });

  function initTravel() {
    var trailFill = document.getElementById("trailFill");
    var trailTag = document.getElementById("trailTag");
    trav.start(function () {
      spcHero.classList.add("hero--scrub");
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#spcHero",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onUpdate: function (self) {
            var p = Math.min(1, self.progress / 0.62);
            trav.draw(Math.round(p * (TN - 1)));
            if (trailFill) trailFill.style.transform = "scaleY(" + p + ")";
            if (trailTag) trailTag.textContent =
              p < 0.02 ? "HEM PARKED" :
              p > 0.985 ? "CLOSED · STRIP EMPTY" :
              "HEM TRAVEL " + Math.round(p * 100) + "%";
          }
        }
      });
      tl.to(".beat-1", { autoAlpha: 0, y: -46, duration: 0.10 }, 0.26)
        .fromTo(".beat-2", { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.10 }, 0.50)
        .to(".beat-2", { autoAlpha: 0, duration: 0.08 }, 0.90)
        .to(".hero-cue", { autoAlpha: 0, duration: 0.05 }, 0.08);
    });
  }

  if (hasGSAP && motionOK && desktop && travCanvas && spcHero) initTravel();

  /* ---------- hero dust ---------- */
  var dust = document.querySelector(".hero-dust");
  if (dust && motionOK) {
    var dctx = dust.getContext("2d");
    var P = [];
    var DN = desktop ? 64 : 28;
    for (var i = 0; i < DN; i++) {
      P.push({
        x: Math.random(), y: Math.random(),
        r: 0.6 + Math.random() * 1.6,
        v: 0.00012 + Math.random() * 0.0004,
        drift: (Math.random() - 0.5) * 0.0002,
        teal: Math.random() < 0.22,
        a: 0.12 + Math.random() * 0.4
      });
    }
    function dustFrame() {
      if (window.scrollY < window.innerHeight * 5 && !document.hidden) {
        var w = dust.clientWidth, h = dust.clientHeight;
        if (dust.width !== w || dust.height !== h) { dust.width = w; dust.height = h; }
        dctx.clearRect(0, 0, w, h);
        for (var i = 0; i < P.length; i++) {
          var p = P[i];
          p.y -= p.v; p.x += p.drift;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          dctx.beginPath();
          dctx.arc(p.x * w, p.y * h, p.r, 0, 6.2832);
          dctx.fillStyle = p.teal
            ? "rgba(249,168,199," + p.a * 0.8 + ")"
            : "rgba(246,83,143," + p.a + ")";
          dctx.fill();
        }
      }
      requestAnimationFrame(dustFrame);
    }
    requestAnimationFrame(dustFrame);
  }

  /* ---------- posture gallery ----------
     Drives the SPC-01 curtain rule table and the Evidence page's real-frame
     classifier gallery from the same component. Plain JS on purpose: the rows
     must stay clickable with no GSAP and no motion. Auto-advance is the only
     part gated on motionOK.
     Captions: a row carrying data-cap supplies its own (Evidence does this,
     one caption per real trial frame); rows without it fall back to the
     curtain-rule list below, so spc01.html needs no markup change. */
  var pgal = document.getElementById("pgal");
  if (pgal) {
    var prows = [].slice.call(pgal.querySelectorAll(".prow"));
    var pimgs = [].slice.call(pgal.querySelectorAll(".pstack img"));
    var pcap = document.getElementById("pcap");
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
      r.addEventListener("click", function () {
        phold = Date.now() + 14000;   /* a person is reading: hold the reel */
        pshow(k);
      });
      /* keyboard focus reads exactly like a click for hold purposes — a
         person tabbing through the rows is reading them one at a time */
      r.addEventListener("focus", function () {
        phold = Date.now() + 14000;
        pshow(k);
      });
    });
    pshow(0);
    if (motionOK && "IntersectionObserver" in window) {
      var pio = new IntersectionObserver(function (es) {
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
      }, { threshold: 0.25 });
      pio.observe(pgal);
    }
  }

  /* ---------- concept films ----------
     Autoplay lives in the HTML so the clips run without JS. The clips are
     ambient product footage, muted and looping, and must always run with no
     visible controls (client 2026-08-05) — including under reduced motion.
     JS only pauses them while they are offscreen. */
  var films = document.querySelectorAll("video.film");
  if (films.length && "IntersectionObserver" in window) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var p = e.target.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          e.target.pause();
        }
      });
    }, { threshold: 0.2 });
    films.forEach(function (v) { fio.observe(v); });
  }

  if (!hasGSAP || !motionOK) return;   /* everything below is pure garnish */

  /* ---------- reveals ----------
     Batched: siblings that enter together animate as one staggered group
     instead of popping in simultaneously. */
  gsap.set(".rv", { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(".rv", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        autoAlpha: 1, y: 0,
        duration: 0.9, ease: "power3.out",
        stagger: 0.08
      });
    }
  });

  /* ---------- pointer-tracked card glow ----------
     One delegated listener feeds --mx/--my to whichever card the cursor
     is over; the glow itself is pure CSS. */
  if (finePointer) {
    var glowSel = ".card, .stat, .tcard, .rcard, .ccard, .mcard, " +
                  ".vm article, .warranty, .step, .prow";
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest ? e.target.closest(glowSel) : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* Section-specific effects below only exist on the product page. `has()`
     keeps the other pages from logging a wall of GSAP target-not-found. */
  function has(sel) { return !!document.querySelector(sel); }

  /* ---------- exploded view ----------
     Anchors are camera-projected percentages dumped straight out of the
     Blender build (ss_explode_seq.py -> explode_anchors.json), so a label
     sits on its real part instead of a hand-guessed pixel. Only parts whose
     x positions are far enough apart to never collide are labelled here —
     the full sixteen live in the list below the stage.
     side: which way the leader runs. len: leader length in px. dx nudges the
     text block sideways off a part it would otherwise cover — the leader stays
     on the anchor regardless. */
  var XANCHORS = [
    { x: 26.21, y: 41.11, side: "up",   len: 62,  dx: -74,  n: "01", t: "POWER + DATA CABLE", d: "Sealed gland · strain relief" },
    { x: 35.39, y: 40.10, side: "down", len: 96,  dx: 0,    n: "02", t: "CAPTIVE SCREWS ×6",  d: "Bonded seal washers" },
    { x: 52.10, y: 40.48, side: "up",   len: 78,  dx: -136, n: "07", t: "COMPUTE CARRIER",    d: "Raspberry Pi CM4 · M.2 storage" },
    { x: 55.91, y: 41.06, side: "down", len: 150, dx: -212, n: "08", t: "CAMERA I/O BOARD",   d: "USB 3 hub · head connectors" },
    { x: 63.32, y: 26.33, side: "up",   len: 54,  dx: 0,    n: "12", t: "QUICK-MOUNT PLATE",  d: "Tool-free bracket interface" },
    { x: 79.46, y: 43.44, side: "up",   len: 92,  dx: -18,  n: "14", t: "STEREO DEPTH MODULE", d: "Sow posture · respiration" },
    { x: 62.19, y: 75.70, side: "down", len: 52,  dx: 0,    n: "16", t: "RGB CAMERA + IR",    d: "Newborn · stillborn imaging" }
  ];

  var xstage = document.getElementById("xstage");
  var xcanvas = document.getElementById("xCanvas");
  var xlabels = document.getElementById("xLabels");

  function buildXLabels() {
    XANCHORS.forEach(function (a) {
      var el = document.createElement("span");
      el.className = "xlabel " + a.side;
      el.innerHTML = "<i class='lead' style='height:" + a.len + "px'></i>" +
        "<b>" + a.n + "</b>" + a.t + "<em>" + a.d + "</em>";
      a.el = el;
      a.lead = el.firstChild;
      xlabels.appendChild(el);
    });
  }

  function placeXLabels(seq) {
    if (!seq.rect) return;
    var r = seq.rect;
    var cb = xcanvas.getBoundingClientRect();
    var sb = xlabels.getBoundingClientRect();
    var ox = cb.left - sb.left + r.x;
    var oy = cb.top - sb.top + r.y;
    XANCHORS.forEach(function (a) {
      var px = ox + r.w * a.x / 100;
      var py = oy + r.h * a.y / 100;
      var b = a.el.getBoundingClientRect();
      /* the leader hangs off the label edge nearest the part, so the label
         body clears the anchor by exactly `len` either way */
      var top = a.side === "up" ? py - a.len - b.height : py + a.len;
      var left = px - 14 + a.dx;
      a.el.style.transform = "translate(" + Math.round(left) + "px," +
        Math.round(top) + "px)";
      /* keep the leader on the part even when the text block is nudged */
      a.lead.style.left = Math.round(px - left) + "px";
    });
  }

  if (xstage && xcanvas && desktop) {
    buildXLabels();
    var xseq = new Sequence(xcanvas, 48, function (i) {
      return "assets/explode/exp_" + String(i).padStart(3, "0") + ".webp";
    });
    xseq.start(function () {
      xstage.classList.add("xstage--scrub");
      gsap.timeline({
        scrollTrigger: {
          trigger: "#xstage",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onUpdate: function (self) {
            /* the assembly is fully apart by 82%; the tail is dwell time so
               the labels can be read without the parts still moving */
            var p = Math.min(1, self.progress / 0.82);
            xseq.draw(Math.round(p * 47));
            if (p > 0.92) {
              xlabels.classList.add("on");
              placeXLabels(xseq);
            } else {
              xlabels.classList.remove("on");
            }
          }
        }
      });
    });
    window.addEventListener("resize", function () {
      if (xlabels.classList.contains("on")) placeXLabels(xseq);
    }, { passive: true });
  }

  /* ---------- SPC-01 filmed control loop ----------
     A 72-frame photoreal sequence rendered by ss02_loop.py: standing
     with BOTH curtains down -> settle sternal-right -> SPM-01 names the
     side, the LEFT curtain lifts -> the roll onto the kept-empty right
     strip -> the right curtain lifts -> the litter crosses from the left
     to nurse. Frame boundaries below mirror that script's own frame-plan
     constants exactly, so status text and captions
     stay truthful to what is actually on screen at each scroll position.
     Same Sequence machinery and no-JS/reduced-motion contract as the hero
     travel scrub: base .loop-stage is a single 100vh no-op block, the tall
     pin only arrives via --scrub once frames have actually loaded. */
  var LN = 72;
  var loopCanvas = document.getElementById("loopCanvas");
  var loopStage = document.getElementById("loopStage");
  var loopSeq = loopCanvas && new Sequence(loopCanvas, LN, function (i) {
    return "assets/loop/loop_" + String(i).padStart(3, "0") + ".webp";
  });

  function initLoop() {
    var caps = [].slice.call(document.querySelectorAll("#loopCaps .sk-cap"));
    var capsEl = document.getElementById("loopCaps");
    var stP = document.getElementById("stPosture");
    var stR = document.getElementById("stRisk");
    var stCL = document.getElementById("stCL");
    var stCR = document.getElementById("stCR");
    function set(el, txt, cls) {
      if (el.textContent !== txt) el.textContent = txt;
      el.className = cls || "";
    }
    /* frame boundaries, verbatim from ss02_loop.py's frame plan.
       FLANK naming (client 2026-08-04 evening): the story label names
       the flank she rolls ONTO. Standing = BOTH curtains down; sternal
       right = the RIGHT (near) curtain holds while the LEFT (far) one
       lifts; lateral right lifts the right curtain too. */
    function loopStatus(i) {
      if (i < 10) {
        set(stP, "STANDING"); set(stR, "POSTURE UNRESOLVED", "hot");
        set(stCL, "DOWN", "hot"); set(stCR, "DOWN", "hot");
      } else if (i < 24) {
        set(stP, "STERNAL LYING, RIGHT");
        set(stR, "ROLL RIGHT · ~3 s", "hot");
        set(stCL, "DOWN", "hot"); set(stCR, "DOWN", "hot");
      } else if (i < 34) {
        set(stP, "STERNAL LYING, RIGHT");
        set(stR, "ROLL RIGHT · ~3 s", "hot");
        set(stCL, i < 30 ? "LIFTING" : "UP", "ok");
        set(stCR, "DOWN", "hot");
      } else if (i < 40) {
        set(stP, "STERNAL LYING, RIGHT");
        set(stR, "ROLL RIGHT · ~3 s", "hot");
        set(stCL, "UP", "ok"); set(stCR, "DOWN", "hot");
      } else if (i < 50) {
        set(stP, "ROLLING RIGHT");
        set(stR, "ROLL IN PROGRESS", "hot");
        set(stCL, "UP", "ok"); set(stCR, "DOWN", "hot");
      } else if (i < 54) {
        set(stP, "LATERAL LYING, RIGHT");
        set(stR, "NONE · TERMINAL", "ok");
        set(stCL, "UP", "ok"); set(stCR, "DOWN", "hot");
      } else if (i < 62) {
        set(stP, "LATERAL LYING, RIGHT");
        set(stR, "NONE · TERMINAL", "ok");
        set(stCL, "UP", "ok"); set(stCR, "LIFTING", "ok");
      } else if (i < 66) {
        set(stP, "LATERAL LYING, RIGHT");
        set(stR, "NONE · TERMINAL", "ok");
        set(stCL, "UP", "ok"); set(stCR, "UP", "ok");
      } else {
        set(stP, "LATERAL LYING · NURSING");
        set(stR, "NONE · TERMINAL", "ok");
        set(stCL, "UP", "ok"); set(stCR, "UP", "ok");
      }
    }
    /* caption windows, same source frame ranges */
    var capT = [[0, 8], [8, 24], [24, 40], [40, 54], [54, 62], [62, 71]];
    var capIdx = -1;
    function loopCaption(i) {
      var k = 0;
      for (var n = 0; n < capT.length; n++) {
        if (i >= capT[n][0] && (i < capT[n][1] || n === capT.length - 1)) { k = n; break; }
      }
      if (k === capIdx) return;
      capIdx = k;
      caps.forEach(function (c, n) { c.classList.toggle("on", n === k); });
    }

    loopSeq.start(function () {
      loopStage.classList.add("loop-stage--scrub");
      capsEl.classList.add("sk-live");
      loopCaption(0);
      gsap.timeline({
        scrollTrigger: {
          trigger: "#loopStage",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onUpdate: function (self) {
            var i = Math.round(self.progress * (LN - 1));
            loopSeq.draw(i);
            loopStatus(i);
            loopCaption(i);
          }
        }
      });
    });
  }

  if (hasGSAP && motionOK && desktop && loopCanvas && loopStage) initLoop();

  /* ---------- count-ups ---------- */
  gsap.utils.toArray("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: function () { el.textContent = pre + obj.v.toFixed(dec) + suf; },
      onComplete: function () { el.textContent = pre + target.toFixed(dec) + suf; }
    });
  });

  /* ---------- washdown parallax ---------- */
  if (has(".wash-bg")) {
    gsap.fromTo(".wash-bg", { yPercent: -8 }, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: ".wash", start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* ---------- split figure parallax ----------
     Every plain split image drifts gently against the scroll. Direct
     children only: imgs inside .fig-media sit under aligned SVG overlays
     (FOV wedges, RF fans) that must stay registered to the pixels. */
  gsap.utils.toArray(".split-img > img").forEach(function (img) {
    gsap.fromTo(img, { y: 30 }, {
      y: -30,
      ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---------- phone: float + bar chart ---------- */
  if (has(".bars i")) {
    gsap.from(".bars i", {
      scaleY: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.07,
      scrollTrigger: { trigger: ".phone-chart", start: "top 92%", once: true }
    });
  }
  if (desktop && has("#phone")) {
    gsap.to("#phone", {
      y: -12,
      duration: 3.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }

  /* ---------- mount card tilt ---------- */
  if (finePointer) {
    gsap.utils.toArray(".mcard").forEach(function (card) {
      var qx = gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power2.out" });
      var qy = gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power2.out" });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        qx(((e.clientX - r.left) / r.width - 0.5) * 10);
        qy(((e.clientY - r.top) / r.height - 0.5) * -10);
      });
      card.addEventListener("pointerleave", function () { qx(0); qy(0); });
      gsap.set(card, { transformPerspective: 700 });
    });
  }

  /* ---------- nav section highlight (same-page anchor links only;
     page links carry a static .on set in the HTML) ---------- */
  gsap.utils.toArray(".nav-links a").forEach(function (link) {
    var id = link.getAttribute("href");
    if (!id || id.charAt(0) !== "#") return;
    var sec = document.querySelector(id);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: function (self) { link.classList.toggle("on", self.isActive); }
    });
  });
})();
