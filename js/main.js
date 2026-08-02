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

  /* ---------- hero turntable ---------- */
  var N = 96;
  var seqSrc = function (i) {
    return "assets/seq/turn_" + String(i).padStart(3, "0") + ".webp";
  };
  var canvas = document.getElementById("turnCanvas");
  var hero = document.getElementById("hero");
  var ring = document.querySelector(".hero-ring circle");
  var imgs = new Array(N);
  var lastDrawn = -1;

  function bestFrame(i) {
    if (imgs[i]) return i;
    for (var d = 1; d < N; d++) {
      if (imgs[i - d]) return i - d;
      if (imgs[i + d]) return i + d;
    }
    return -1;
  }

  function drawFrame(i) {
    var k = bestFrame(i);
    if (k < 0 || !canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth * dpr;
    var h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    var img = imgs[k];
    var s = Math.min(w / img.width, h / img.height);
    var dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    lastDrawn = k;
  }

  function loadRest() {
    var next = 0, inFlight = 0, MAXPAR = 6;
    function pump() {
      while (inFlight < MAXPAR && next < N) {
        (function (i) {
          if (imgs[i]) { return; }
          inFlight++;
          var im = new Image();
          im.onload = function () {
            imgs[i] = im;
            inFlight--;
            if (Math.abs(i - lastDrawn) < 3) drawFrame(i);
            pump();
          };
          im.onerror = function () { inFlight--; pump(); };
          im.src = seqSrc(i);
        })(next++);
      }
    }
    pump();
  }

  function initTurntable() {
    var first = new Image();
    first.onload = function () {
      imgs[0] = first;
      hero.classList.add("hero--scrub");
      drawFrame(0);
      loadRest();
      buildHeroTimeline();
      ScrollTrigger.refresh();
    };
    /* onerror: sequence not there — the static hero stays, no harm */
    first.src = seqSrc(0);
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
    tl.to(".beat-1", { autoAlpha: 0, y: -46, duration: 0.08 }, 0.20)
      .fromTo(".beat-2", { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.30)
      .to(".beat-2", { autoAlpha: 0, y: -46, duration: 0.08 }, 0.52)
      .fromTo(".beat-3", { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.62)
      .to(".beat-3", { autoAlpha: 0, duration: 0.06 }, 0.90)
      .to(".hero-cue", { autoAlpha: 0, duration: 0.04 }, 0.06);
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

  /* ---------- exploded labels stagger ---------- */
  if (desktop && has(".xlabel")) {
    gsap.from(".xlabel", {
      autoAlpha: 0,
      y: 14,
      duration: 0.55,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: { trigger: ".xwrap", start: "top 62%", once: true }
    });
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
