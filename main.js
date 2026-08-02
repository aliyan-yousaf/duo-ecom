/* ==========================================================================
   DuoEcom — main.js
   Premium interaction layer: theme + mobile menu, scroll progress,
   scroll-reveal, image "uncover" reveal, stat count-up, magnetic buttons,
   3D card tilt, gentle hero parallax, portfolio filtering, plus the new
   premium functional sections — infinite tech marquee, numbered interactive
   services tabs, and a shared draggable/swipeable carousel (used for both
   the portfolio preview and testimonials). Everything guards for
   prefers-reduced-motion and touch input, and uses passive/rAF-throttled
   listeners so it stays cheap on scroll.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  var onReady = function (fn) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Theme toggle (persisted in localStorage, syncs header + mobile)    */
  /* ------------------------------------------------------------------ */
  function initTheme() {
    var STORAGE_KEY = "duoecom-theme";
    var toggles = doc.querySelectorAll(".theme-toggle, .theme-toggle-mobile");
    if (!toggles.length) return;

    var isDark = function () {
      return root.getAttribute("data-theme") === "dark";
    };

    var setPressed = function () {
      var dark = isDark();
      toggles.forEach(function (btn) {
        btn.setAttribute("aria-pressed", dark ? "true" : "false");
      });
    };
    setPressed();

    var apply = function (dark) {
      if (dark) {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
      } catch (e) {
        /* storage unavailable — theme just won't persist */
      }
      setPressed();
    };

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(!isDark());
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                        */
  /* ------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = doc.querySelector(".nav-toggle");
    var menu = doc.querySelector(".mobile-menu");
    if (!toggle || !menu) return;

    var open = false;

    var setOpen = function (next) {
      open = next;
      toggle.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      doc.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", function () {
      setOpen(!open);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Sticky header — glass state after a small scroll                   */
  /* ------------------------------------------------------------------ */
  function initHeaderScrollState() {
    var header = doc.querySelector(".site-header");
    if (!header) return;
    var ticking = false;

    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------ */
  /* Scroll progress bar                                                */
  /* ------------------------------------------------------------------ */
  function initScrollProgress() {
    var bar = doc.querySelector(".scroll-progress");
    if (!bar) return;
    var ticking = false;

    var update = function () {
      var scrollTop = window.scrollY;
      var docHeight = doc.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal — .reveal, .reveal-img, .hero-stat, .skill-bar-fill  */
  /* ------------------------------------------------------------------ */
  function initScrollReveal() {
    var targets = doc.querySelectorAll(
      ".reveal, .reveal-img, .hero-stat, .skill-bar-fill"
    );
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("in-view");
      });
      runStatCounters(doc.querySelectorAll(".hero-stat"));
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          if (entry.target.classList.contains("hero-stat")) {
            runStatCounters([entry.target]);
          }
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero stat count-up — parses "60+", "4.9/5", "100%" etc. and         */
  /* animates the numeric part while keeping the original suffix.       */
  /* ------------------------------------------------------------------ */
  function runStatCounters(nodes) {
    nodes.forEach(function (stat) {
      var numEl = stat.querySelector(".num");
      if (!numEl || numEl.dataset.counted) return;
      numEl.dataset.counted = "true";

      var raw = numEl.textContent.trim();
      var match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) return;

      var target = parseFloat(match[1]);
      var suffix = match[2];
      var decimals = (match[1].split(".")[1] || "").length;
      var duration = 1100;
      var start = null;

      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
        var value = target * eased;
        numEl.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          numEl.textContent = raw;
        }
      };

      requestAnimationFrame(step);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic buttons                                                   */
  /* ------------------------------------------------------------------ */
  function initMagneticButtons() {
    if (reduceMotion || isTouch) return;
    var buttons = doc.querySelectorAll(".btn-accent, .btn-ghost, .btn-primary");
    var strength = 0.28;
    var maxPull = 10;

    buttons.forEach(function (btn) {
      var raf = null;

      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        var mx = Math.max(-maxPull, Math.min(maxPull, relX * strength));
        var my = Math.max(-maxPull, Math.min(maxPull, relY * strength));

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          btn.style.setProperty("--mx", mx.toFixed(1) + "px");
          btn.style.setProperty("--my", my.toFixed(1) + "px");
        });
      });

      btn.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3D card tilt                                                       */
  /* ------------------------------------------------------------------ */
  function initCardTilt() {
    if (reduceMotion || isTouch) return;
    var cards = doc.querySelectorAll(
      ".card:not(.portfolio-card):not(.testimonial-card), .tech-card"
    );
    var maxTilt = 6;

    cards.forEach(function (card) {
      card.setAttribute("data-tilt", "");
      var raf = null;

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width; /* 0..1 */
        var py = (e.clientY - rect.top) / rect.height;
        var ry = (px - 0.5) * (maxTilt * 2);
        var rx = (0.5 - py) * (maxTilt * 2);

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.setProperty("--rx", rx.toFixed(2) + "deg");
          card.style.setProperty("--ry", ry.toFixed(2) + "deg");
        });
      });

      card.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero network — gentle scroll parallax                              */
  /* ------------------------------------------------------------------ */
  function initHeroParallax() {
    if (reduceMotion) return;
    var net = doc.querySelector(".hero-network");
    if (!net) return;
    var ticking = false;

    var update = function () {
      var offset = Math.min(window.scrollY * 0.08, 40);
      net.style.transform = "translateY(" + offset.toFixed(1) + "px)";
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* FAQ accordion (present on other pages of the site; safe no-op here) */
  /* ------------------------------------------------------------------ */
  function initFaq() {
    var items = doc.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var q = item.querySelector(".faq-q");
      if (!q) return;
      q.addEventListener("click", function () {
        var wasOpen = item.classList.contains("open");
        items.forEach(function (other) {
          other.classList.remove("open");
        });
        if (!wasOpen) item.classList.add("open");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Portfolio filter buttons (portfolio page)                          */
  /* ------------------------------------------------------------------ */
  function initPortfolioFilter() {
    var buttons = doc.querySelectorAll(".filter-btn");
    var cards = doc.querySelectorAll(".portfolio-card");
    if (!buttons.length || !cards.length) return;

    var applyFilter = function (filter) {
      cards.forEach(function (card) {
        var category = card.getAttribute("data-category");
        var show = category === filter;
        card.style.display = show ? "" : "none";
      });
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        applyFilter(btn.getAttribute("data-filter"));
      });
    });

    // Apply whichever button is marked active on page load,
    // so the grid isn't showing every category before the first click.
    var initialBtn = doc.querySelector(".filter-btn.is-active") || buttons[0];
    if (initialBtn) {
      applyFilter(initialBtn.getAttribute("data-filter"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Smooth in-page anchor scrolling (nav mostly links between pages,    */
  /* but this covers any #anchor links safely without a heavy library). */
  /* ------------------------------------------------------------------ */
  function initAnchorScroll() {
    doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;
        var target = doc.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tech marquee — infinite auto-scroll strip. The HTML already ships  */
  /* two identical tracks back to back so the CSS keyframe loop is      */
  /* seamless; JS just pauses the animation while a finger is dragging  */
  /* on touch devices, mirroring the hover-to-pause behaviour on desktop*/
  /* ------------------------------------------------------------------ */
  function initTechMarquee() {
    var marquee = doc.querySelector("[data-marquee]");
    if (!marquee) return;

    if (!isTouch) return; // hover-to-pause via CSS already covers desktop

    var startX = null;
    marquee.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
        marquee.classList.add("is-paused");
      },
      { passive: true }
    );
    marquee.addEventListener(
      "touchend",
      function () {
        marquee.classList.remove("is-paused");
        startX = null;
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Services — numbered interactive tab panel (w3lead-style).          */
  /* Clicking (or hovering, on desktop) a numbered row swaps the panel  */
  /* on the right. Each active row also auto-advances after a few       */
  /* seconds via a thin progress bar, similar to the reference site.    */
  /* ------------------------------------------------------------------ */
  function initServiceTabs() {
    var wrap = doc.querySelector("[data-service-tabs]");
    if (!wrap) return;

    var navItems = Array.prototype.slice.call(
      wrap.querySelectorAll(".service-nav-item")
    );
    var panels = Array.prototype.slice.call(
      wrap.querySelectorAll(".service-panel")
    );
    if (!navItems.length || !panels.length) return;

    var activeIndex = 0;
    var AUTOPLAY_MS = 6000;
    var timer = null;
    var paused = false;

    var setActive = function (index) {
      activeIndex = index;
      navItems.forEach(function (item, i) {
        item.classList.toggle("is-active", i === index);
      });
      panels.forEach(function (panel, i) {
        panel.classList.toggle("is-active", i === index);
      });
    };

    var next = function () {
      setActive((activeIndex + 1) % navItems.length);
    };

    var restartAutoplay = function () {
      if (timer) clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () {
        if (!paused) next();
      }, AUTOPLAY_MS);
    };

    navItems.forEach(function (item, i) {
      item.addEventListener("click", function () {
        setActive(i);
        restartAutoplay();
      });
    });

    wrap.addEventListener("mouseenter", function () {
      paused = true;
    });
    wrap.addEventListener("mouseleave", function () {
      paused = false;
    });

    setActive(0);
    restartAutoplay();
  }

  /* ------------------------------------------------------------------ */
  /* Shared carousel — powers both the portfolio preview and the        */
  /* testimonials grid. Supports arrow buttons, dot pagination,         */
  /* pointer drag / touch swipe, keyboard arrows, and (for testimonials)*/
  /* gentle autoplay that pauses on hover/focus/drag.                   */
  /* ------------------------------------------------------------------ */
  function initCarousels() {
    var carousels = doc.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    carousels.forEach(function (root) {
      var viewport = root.querySelector("[data-carousel-viewport]");
      var track = root.querySelector("[data-carousel-track]");
      var slides = Array.prototype.slice.call(
        track ? track.children : []
      );
      var prevBtn = root.querySelector("[data-carousel-prev]");
      var nextBtn = root.querySelector("[data-carousel-next]");
      var dotsWrap = root.querySelector("[data-carousel-dots]");
      if (!viewport || !track || !slides.length) return;

      var perView = 1;
      var index = 0;
      var autoplayTimer = null;
      var isTestimonial = root.classList.contains("testimonial-carousel");
      var AUTOPLAY_MS = 5000;

      var getPerView = function () {
        var w = window.innerWidth;
        if (w >= 1040) return Math.min(3, slides.length);
        if (w >= 700) return Math.min(2, slides.length);
        return 1;
      };

      var maxIndex = function () {
        return Math.max(0, slides.length - perView);
      };

      var buildDots = function () {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = "";
        var count = maxIndex() + 1;
        for (var i = 0; i < count; i++) {
          var dot = doc.createElement("button");
          dot.type = "button";
          dot.className = "carousel-dot";
          dot.setAttribute("aria-label", "Go to slide " + (i + 1));
          (function (idx) {
            dot.addEventListener("click", function () {
              goTo(idx);
              restartAutoplay();
            });
          })(i);
          dotsWrap.appendChild(dot);
        }
      };

      var updateDots = function () {
        if (!dotsWrap) return;
        Array.prototype.forEach.call(
          dotsWrap.children,
          function (dot, i) {
            dot.classList.toggle("is-active", i === index);
          }
        );
      };

      var updateArrows = function () {
        if (prevBtn) prevBtn.disabled = index <= 0 && maxIndex() === 0 ? false : index <= 0;
        if (nextBtn) nextBtn.disabled = index >= maxIndex();
        if (maxIndex() === 0) {
          if (prevBtn) prevBtn.disabled = true;
          if (nextBtn) nextBtn.disabled = true;
        }
      };

      var render = function () {
        var slideWidth = slides[0].getBoundingClientRect().width;
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var offset = index * (slideWidth + gap);
        track.style.transform = "translateX(-" + offset + "px)";
        updateDots();
        updateArrows();
      };

      var goTo = function (i) {
        index = Math.max(0, Math.min(i, maxIndex()));
        render();
      };

      var next = function () {
        goTo(index >= maxIndex() ? 0 : index + 1);
      };
      var prev = function () {
        goTo(index <= 0 ? maxIndex() : index - 1);
      };

      var restartAutoplay = function () {
        if (autoplayTimer) clearInterval(autoplayTimer);
        if (!isTestimonial || reduceMotion) return;
        autoplayTimer = setInterval(next, AUTOPLAY_MS);
      };

      if (nextBtn)
        nextBtn.addEventListener("click", function () {
          next();
          restartAutoplay();
        });
      if (prevBtn)
        prevBtn.addEventListener("click", function () {
          prev();
          restartAutoplay();
        });

      root.addEventListener("mouseenter", function () {
        if (autoplayTimer) clearInterval(autoplayTimer);
      });
      root.addEventListener("mouseleave", restartAutoplay);

      /* Pointer / touch drag */
      var dragStartX = 0;
      var dragging = false;
      var startOffset = 0;

      var pointerDown = function (e) {
        dragging = true;
        dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
        var slideWidth = slides[0].getBoundingClientRect().width;
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        startOffset = index * (slideWidth + gap);
        track.classList.add("is-dragging");
        if (autoplayTimer) clearInterval(autoplayTimer);
      };

      var pointerMove = function (e) {
        if (!dragging) return;
        var x = (e.touches ? e.touches[0].clientX : e.clientX);
        var delta = x - dragStartX;
        track.style.transform = "translateX(" + (-startOffset + delta) + "px)";
      };

      var pointerUp = function (e) {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        var x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
        var delta = x - dragStartX;
        var threshold = 50;
        if (delta < -threshold) next();
        else if (delta > threshold) prev();
        else render();
        restartAutoplay();
      };

      track.addEventListener("mousedown", pointerDown);
      window.addEventListener("mousemove", pointerMove);
      window.addEventListener("mouseup", pointerUp);
      track.addEventListener("touchstart", pointerDown, { passive: true });
      track.addEventListener("touchmove", pointerMove, { passive: true });
      track.addEventListener("touchend", pointerUp);

      /* Keyboard */
      root.setAttribute("tabindex", "0");
      root.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") {
          next();
          restartAutoplay();
        } else if (e.key === "ArrowLeft") {
          prev();
          restartAutoplay();
        }
      });

      var handleResize = function () {
        perView = getPerView();
        index = Math.min(index, maxIndex());
        buildDots();
        render();
      };

      window.addEventListener("resize", handleResize);

      perView = getPerView();
      buildDots();
      render();
      restartAutoplay();
    });
  }

  /* ------------------------------------------------------------------ */
  /* GSAP-powered advanced animations                                   */
  /* Masked-line hero intro, scroll-triggered "wipe" reveal on every     */
  /* section heading, an ambient parallax glow on the CTA band, and a   */
  /* staggered star pop-in on testimonial cards. Everything here is     */
  /* feature-detected — if GSAP/ScrollTrigger fail to load (CDN         */
  /* blocked, offline, etc.) it quietly no-ops and the existing CSS/AOS */
  /* reveals still cover the page. Fully skipped for reduced motion.    */
  /* ------------------------------------------------------------------ */
  var hasGsap = typeof window.gsap !== "undefined";
  var hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
  if (hasGsap && hasScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* Wraps every word of the hero <h1> in its own overflow-hidden inline
     box so each can be masked and cascaded up individually — recurses
     into the <em> accent span so those words keep their color, and
     leaves the <br> untouched so the line break still falls in place. */
  function wrapWordsInPlace(node, collected) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var parts = child.textContent.split(/(\s+)/);
        var frag = doc.createDocumentFragment();
        parts.forEach(function (part) {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(doc.createTextNode(part));
            return;
          }
          var word = doc.createElement("span");
          word.className = "word";
          var inner = doc.createElement("span");
          inner.className = "word-inner";
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
          collected.push(inner);
        });
        node.replaceChild(frag, child);
      } else if (child.tagName === "EM") {
        wrapWordsInPlace(child, collected);
      }
    });
  }

  function splitHeroTitleWords() {
    var h1 = doc.querySelector(".hero-title");
    if (!h1 || h1.dataset.split) return null;
    h1.dataset.split = "true";
    var words = [];
    wrapWordsInPlace(h1, words);
    return words;
  }

  function initHeroIntro() {
    var hero = doc.querySelector(".hero");
    var stage = doc.querySelector(".hero-premium");
    if (!hero || !stage || !hasGsap || reduceMotion) return;

    // Flip the CSS keyframes off and gsap.set() the starting state in the
    // same synchronous pass so there's no flash between the two.
    hero.classList.add("gsap-ready");

    var badge = stage.querySelector(".hero-badge");
    var words = splitHeroTitleWords();
    var lead = stage.querySelector(".lead");
    var actions = stage.querySelector(".hero-actions");
    var stats = stage.querySelectorAll(".hero-stat");

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (badge) {
      gsap.set(badge, { opacity: 0, y: -10, scale: 0.9 });
      tl.to(badge, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0);
    }
    if (words && words.length) {
      gsap.set(words, { yPercent: 120, opacity: 0 });
      tl.to(
        words,
        { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.035, ease: "power4.out" },
        0.12
      );
    }
    if (lead) {
      gsap.set(lead, { opacity: 0, y: 16 });
      tl.to(lead, { opacity: 1, y: 0, duration: 0.7 }, 0.55);
    }
    if (actions && actions.children.length) {
      gsap.set(actions.children, { opacity: 0, y: 14, scale: 0.96 });
      tl.to(
        actions.children,
        { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08 },
        0.68
      );
    }
    if (stats.length) {
      gsap.set(stats, { opacity: 0, y: 12 });
      tl.to(stats, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.8);
    }
  }

  /* One-time "drawing" animation for the decorative hero network — the
     faint grid lines stroke themselves in, then the dots pop at their
     intersections. The pulsing "flow" lines (net-flow-*) are untouched;
     this only draws the static base grid underneath them. */
  function initHeroNetworkDraw() {
    if (!hasGsap || reduceMotion) return;
    var lines = doc.querySelectorAll(".hero-network .net-line");
    var dots = doc.querySelectorAll(".hero-network .net-dot");
    if (!lines.length) return;

    lines.forEach(function (line, i) {
      var len = line.getTotalLength ? line.getTotalLength() : 400;
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(line, {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: "power2.inOut",
        delay: 0.25 + i * 0.12,
      });
    });

    if (dots.length) {
      gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
      gsap.to(dots, {
        scale: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "back.out(3)",
        delay: 1.1,
      });
    }
  }

  /* Cursor-reactive spotlight over the hero — pure CSS-var driven so it
     still works even if GSAP fails to load. Desktop/hover only. */
  function initHeroSpotlight() {
    if (isTouch) return;
    var stage = doc.querySelector(".hero-premium");
    var spot = stage && stage.querySelector(".hero-spotlight");
    if (!stage || !spot) return;
    var raf = null;

    stage.addEventListener("mousemove", function (e) {
      var rect = stage.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        stage.style.setProperty("--spot-x", x.toFixed(1) + "%");
        stage.style.setProperty("--spot-y", y.toFixed(1) + "%");
      });
    });
    stage.addEventListener("mouseenter", function () {
      stage.classList.add("spot-active");
    });
    stage.addEventListener("mouseleave", function () {
      stage.classList.remove("spot-active");
    });
  }

  /* Scroll-triggered "wipe" reveal — every section heading on the page
     unmasks left-to-right as it enters the viewport, layered on top of
     the existing fade + underline-draw for a punchier, more premium feel. */
  function initSectionHeadingReveal() {
    if (!hasGsap || !hasScrollTrigger || reduceMotion) return;
    var heads = doc.querySelectorAll(".section-head h2, .cta-band h2");

    heads.forEach(function (h) {
      gsap.fromTo(
        h,
        { clipPath: "inset(0 100% 0 0)", "-webkit-clip-path": "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          "-webkit-clip-path": "inset(0 0% 0 0)",
          duration: 1,
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: h,
            start: "top 85%",
            once: true,
          },
        }
      );
    });
  }

  /* Ambient parallax glow behind the CTA band — drifts gently as the     */
  /* section scrolls through the viewport, driven by the same CSS custom */
  /* properties the ::before radial gradient already reads from.         */
  function initCtaAmbientGlow() {
    if (!hasGsap || !hasScrollTrigger || reduceMotion) return;
    var cta = doc.querySelector(".cta-band");
    if (!cta) return;

    gsap.fromTo(
      cta,
      { "--cta-glow-x": "0px", "--cta-glow-y": "0px" },
      {
        "--cta-glow-x": "-70px",
        "--cta-glow-y": "60px",
        ease: "none",
        scrollTrigger: {
          trigger: cta,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    );
  }

  /* Testimonial star ratings pop in one-by-one, back-eased, once the     */
  /* card scrolls into view — a small but noticeably "alive" touch that   */
  /* the plain fade-in reveal doesn't give on its own.                    */
  function initTestimonialStarPop() {
    if (!hasGsap || !hasScrollTrigger || reduceMotion) return;
    var groups = doc.querySelectorAll(".testimonial-card .stars");

    groups.forEach(function (group) {
      var stars = group.querySelectorAll("svg");
      if (!stars.length) return;
      gsap.set(stars, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" });
      gsap.to(stars, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.07,
        ease: "back.out(3)",
        scrollTrigger: {
          trigger: group,
          start: "top 88%",
          once: true,
        },
      });
    });
  }

  /* Tech-stack icons get a lively little scale/lift pop on hover, on top */
  /* of the existing 3D tilt on the card itself.                          */
  function initTechIconPop() {
    if (!hasGsap || reduceMotion || isTouch) return;
    doc.querySelectorAll(".tech-card .tech-icon").forEach(function (icon) {
      var card = icon.closest(".tech-card");
      if (!card) return;
      card.addEventListener("mouseenter", function () {
        gsap.to(icon, { scale: 1.12, y: -4, duration: 0.35, ease: "back.out(2.5)" });
      });
      card.addEventListener("mouseleave", function () {
        gsap.to(icon, { scale: 1, y: 0, duration: 0.35, ease: "power2.out" });
      });
    });
  }

  function initGsapAnimations() {
    initHeroIntro();
    initHeroNetworkDraw();
    initHeroSpotlight();
    initSectionHeadingReveal();
    initCtaAmbientGlow();
    initTestimonialStarPop();
    initTechIconPop();
  }

  onReady(function () {
    initTheme();
    initMobileMenu();
    initHeaderScrollState();
    initScrollProgress();
    initScrollReveal();
    initMagneticButtons();
    initCardTilt();
    initHeroParallax();
    initFaq();
    initPortfolioFilter();
    initAnchorScroll();
    initTechMarquee();
    initServiceTabs();
    initCarousels();
    initGsapAnimations();
  });
})();