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

  /* ---------- promo bar ----------
     Pinned under the fixed nav, so it costs vertical space the layout has to
     know about. body.has-promo carries that offset; dismissing removes it and
     the choice sticks for the session. */
  var promo = document.getElementById("promo");
  if (promo) {
    var DISMISS = "ss-promo-dismissed";
    var gone = false;
    try { gone = sessionStorage.getItem(DISMISS) === "1"; } catch (e) {}
    if (gone) {
      promo.remove();
    } else {
      document.body.classList.add("has-promo");
      var x = promo.querySelector(".promo-x");
      if (x) x.addEventListener("click", function () {
        promo.remove();
        document.body.classList.remove("has-promo");
        try { sessionStorage.setItem(DISMISS, "1"); } catch (e) {}
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      });
    }
  }

  /* ---------- nav progress + seal line (no GSAP needed) ---------- */
  var navBar = document.querySelector(".nav-progress");
  var sealFill = document.querySelector(".sealline-fill");
  var sealDot = document.querySelector(".sealline-dot");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (navBar) navBar.style.transform = "scaleX(" + p + ")";
      if (sealFill) sealFill.style.transform = "scaleY(" + p + ")";
      if (sealDot) sealDot.style.top = (p * 100) + "%";
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
            if (Math.abs(i - self.lastDrawn) < 3) self.draw(i);
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

  if (!hasGSAP || !motionOK) return;   /* everything below is pure garnish */

  /* ---------- reveals ---------- */
  gsap.utils.toArray(".rv").forEach(function (el) {
    gsap.from(el, {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

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

  /* ---------- heads figure parallax ---------- */
  if (has("#headsFig img")) {
    gsap.fromTo("#headsFig img", { y: 30 }, {
      y: -30,
      ease: "none",
      scrollTrigger: { trigger: "#headsFig", start: "top bottom", end: "bottom top", scrub: true }
    });
  }

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
