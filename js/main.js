(function () {
  "use strict";

  const cfg = window.WEDDING_CONFIG;
  if (!cfg) {
    console.error("WEDDING_CONFIG missing. Load js/config.js first.");
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Populate from config ---------- */
  function populate() {
    const { couple, date, location, hero, invitation, venue, family, rsvp, finale } = cfg;
    const mono = couple.monogram;
    const coupleLine = `${couple.groom} & ${couple.bride}`;
    const dateUpper = date.display.toUpperCase();

    document.title = `${couple.groom} & ${couple.bride} — ${cfg.brand}`;

    $("#hero-image").src = hero.image;
    $("#hero-image").alt = "";
    $("#hero-eyebrow").textContent = hero.eyebrow;

    $("#envelope-mono").textContent = mono;
    $("#envelope-couple").textContent = coupleLine.toUpperCase();
    $("#envelope-date").textContent = dateUpper;
    $("#seal-mono").textContent = mono;

    $("#card-mono").textContent = mono;
    $("#card-groom").textContent = couple.groom.toUpperCase();
    $("#card-bride").textContent = couple.bride.toUpperCase();
    $("#card-date").textContent = dateUpper;

    $("#opening-tagline").textContent = hero.tagline;
    $("#open-label").textContent = hero.openLabel;
    $("#open-hint").textContent = hero.openHint;
    $("#handwritten-line").textContent = hero.handwritten;

    $("#groom-name").textContent = couple.groom.toUpperCase();
    $("#bride-name").textContent = couple.bride.toUpperCase();
    $("#hero-invite").textContent = hero.inviteLine;
    $("#hero-date").textContent = date.display;

    applyGuestGreeting();

    $("#invitation-image").src = invitation.image;
    $("#invitation-headline").textContent = invitation.headline;
    $("#invitation-text").textContent = invitation.paragraph;

    $("#cal-day").textContent = date.day;
    $("#cal-number").textContent = date.dayNumber;
    $("#cal-month").textContent = date.month;
    $("#cal-year").textContent = date.year;
    $("#cal-place").textContent = `${location.city}, ${location.state}`;

    $("#venue-image").src = venue.image;
    $("#venue-name").textContent = venue.name;
    $("#venue-place").textContent = `${location.city}, ${location.state}`;
    $("#venue-address").textContent = venue.address;
    $("#venue-map").href = venue.mapUrl;
    $("#venue-directions").href = venue.directionsUrl;

    $("#family-heading").textContent = family.heading;
    $("#bride-family-label").textContent = family.bride.label;
    $("#groom-family-label").textContent = family.groom.label;
    renderFamily($("#bride-family-list"), family.bride.members);
    renderFamily($("#groom-family-list"), family.groom.members);

    $("#rsvp-heading").textContent = rsvp.heading;
    $("#rsvp-support").textContent = rsvp.supporting;
    $("#send-wishes").href = `mailto:${rsvp.wishesEmail}?subject=Wedding%20Wishes%20for%20${encodeURIComponent(coupleLine)}`;
    $("#whatsapp-us").href = `https://wa.me/${rsvp.whatsapp}?text=${encodeURIComponent(`Congratulations ${coupleLine}! Looking forward to your wedding.`)}`;

    $("#finale-image").src = finale.image;
    $("#finale-line").textContent = finale.line;
    $("#finale-names").textContent = coupleLine;
    $("#finale-date").textContent = dateUpper;
    $("#finale-signoff").textContent = finale.signOff;
    $("#finale-couple").textContent = coupleLine;

    renderStory();
    renderEvents();
    renderGallery();
    setupMusic();
  }

  function applyGuestGreeting() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("to") || params.get("guest") || params.get("name");
    const el = $("#guest-greeting");
    if (!raw) {
      el.hidden = true;
      return;
    }
    const name = decodeURIComponent(raw).trim().replace(/[<>]/g, "");
    if (!name) {
      el.hidden = true;
      return;
    }
    const pretty = name.charAt(0).toUpperCase() + name.slice(1);
    el.textContent = `Dear ${pretty},`;
    el.hidden = false;
  }

  function renderFamily(list, members) {
    list.innerHTML = members
      .map(
        (m) =>
          `<li><p class="family__name">${escapeHtml(m.name)}</p><p class="family__relation">${escapeHtml(m.relation)}</p></li>`
      )
      .join("");
  }

  function renderStory() {
    const track = $("#story-track");
    track.innerHTML = cfg.story
      .map(
        (ch, i) => `
      <article class="story-chapter" data-reveal style="transition-delay:${i * 0.08}s">
        <div class="story-chapter__media">
          <img src="${ch.image}" alt="${escapeHtml(ch.title)}" loading="lazy">
        </div>
        <div class="story-chapter__body">
          <p class="story-chapter__chapter">${escapeHtml(ch.chapter)}</p>
          <h3 class="story-chapter__title">${escapeHtml(ch.title)}</h3>
          <p class="story-chapter__text">${escapeHtml(ch.text)}</p>
        </div>
      </article>`
      )
      .join("");

    track.addEventListener("scroll", () => {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? (track.scrollLeft / max) * 100 : 0;
      $("#story-progress-bar").style.width = `${pct}%`;
    });
  }

  function renderEvents() {
    const root = $("#events-list");
    root.innerHTML = cfg.events
      .map(
        (ev, i) => `
      <article class="event-block${i % 2 === 1 ? " event-block--flip" : ""}" data-theme="${ev.theme}" data-reveal>
        <div class="event-block__media">
          <img src="${ev.image}" alt="${escapeHtml(ev.name)}" loading="lazy">
        </div>
        <div class="event-block__body">
          <h3 class="event-block__name">${escapeHtml(ev.name)}</h3>
          <div class="event-meta">
            <span>${escapeHtml(ev.date)}</span>
            <span>${escapeHtml(ev.time)}</span>
          </div>
          <p class="event-block__desc">${escapeHtml(ev.description)}</p>
          <p class="event-block__dress"><strong>Dress code</strong>${escapeHtml(ev.dressCode)}</p>
          <p class="event-block__venue">${escapeHtml(ev.venue)}</p>
          <a class="btn btn--outline" href="${ev.directionsUrl}" target="_blank" rel="noopener">Directions</a>
        </div>
      </article>`
      )
      .join("");
  }

  let galleryItems = [];

  function renderGallery() {
    const masonry = $("#gallery-masonry");
    galleryItems = cfg.gallery;
    masonry.innerHTML = galleryItems
      .map(
        (g, i) => `
      <button type="button" class="gallery-item" data-span="${g.span}" data-index="${i}" role="listitem" aria-label="View ${escapeHtml(g.alt)}">
        <img src="${g.src}" alt="${escapeHtml(g.alt)}" loading="lazy">
      </button>`
      )
      .join("");

    masonry.addEventListener("click", (e) => {
      const btn = e.target.closest(".gallery-item");
      if (!btn) return;
      openLightbox(Number(btn.dataset.index));
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Open invitation (cinematic unlock) ---------- */
  function setupOpening() {
    const opening = $("#opening");
    const btn = $("#open-invitation");
    const seal = $("#wax-seal");
    const header = $("#site-header");
    const main = $("#main");
    const music = $("#music-control");
    let unlocking = false;

    const start = () => {
      if (unlocking) return;
      unlocking = true;
      runUnlockSequence(opening, header, main, music);
    };

    btn.addEventListener("click", start);
    seal.addEventListener("click", start);
    $("#envelope").addEventListener("click", (e) => {
      if (e.target.closest(".wax-seal")) return;
      start();
    });

    document.addEventListener("keydown", (e) => {
      if (document.body.classList.contains("is-open")) return;
      if (e.key === "Enter" || e.key === " ") {
        const active = document.activeElement;
        if (active === btn || active === seal || active === document.body || active === document.documentElement) {
          e.preventDefault();
          start();
        }
      }
    });
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function runUnlockSequence(opening, header, main, music) {
    const add = (cls) => opening.classList.add(cls);

    if (reduceMotion) {
      add("is-unlocking");
      add("is-reveal");
      add("is-reveal-names");
      add("is-reveal-invite");
      add("is-reveal-date");
      await wait(500);
      add("is-exiting");
      await wait(400);
      revealSite(opening, header, main, music);
      return;
    }

    add("is-unlocking");
    await wait(180);

    add("is-seal-cracked");
    await wait(850);

    add("is-flap-open");
    await wait(700);

    add("is-card-rising");
    await wait(900);

    add("is-light-sweep");
    spawnUnlockPetals(10);
    await wait(700);

    add("is-envelope-fade");
    await wait(650);

    add("is-reveal");
    await wait(450);

    add("is-reveal-names");
    await wait(700);

    add("is-reveal-invite");
    await wait(550);

    add("is-reveal-date");
    await wait(1100);

    document.body.classList.add("is-opening-transition");
    add("is-exiting");
    await wait(1000);

    revealSite(opening, header, main, music);
    window.setTimeout(() => {
      document.body.classList.remove("is-opening-transition");
    }, 1600);
  }

  function spawnUnlockPetals(count) {
    if (reduceMotion) return;
    const layer = $("#petal-layer");
    for (let i = 0; i < count; i++) {
      window.setTimeout(() => {
        const p = document.createElement("span");
        p.className = "petal";
        p.style.left = `${15 + Math.random() * 70}%`;
        p.style.animationDuration = `${5 + Math.random() * 4}s`;
        p.style.width = `${6 + Math.random() * 7}px`;
        p.style.height = `${8 + Math.random() * 9}px`;
        p.style.opacity = "0.4";
        layer.appendChild(p);
        window.setTimeout(() => p.remove(), 10000);
      }, i * 120);
    }
  }

  function revealSite(opening, header, main, music) {
    opening.classList.add("is-gone");
    opening.setAttribute("hidden", "");
    header.hidden = false;
    main.hidden = false;
    music.classList.remove("music-control--locked");
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-open");
    observeReveals();
    observeEvents();
    startCountdown();
    setupFinalePetals();
    setupParallax();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- Scroll progress & nav ---------- */
  function setupChrome() {
    const progress = $("#scroll-progress");
    const header = $("#site-header");
    let lastY = 0;

    window.addEventListener(
      "scroll",
      () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
        progress.style.width = `${pct}%`;

        const y = window.scrollY;
        if (y > 120 && y > lastY) {
          header.classList.add("is-hidden");
        } else {
          header.classList.remove("is-hidden");
        }
        lastY = y;

        updateActiveNav();
      },
      { passive: true }
    );

    const toggle = $("#nav-toggle");
    const panel = $("#nav-panel");

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });

    $$(".nav-panel a, .nav-desktop a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      });
    });
  }

  function updateActiveNav() {
    const sections = ["home", "story", "events", "venue", "gallery", "rsvp"];
    let current = "home";
    for (const id of sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.4) current = id;
    }
    $$(".nav-desktop a").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${current}`);
    });
  }

  /* ---------- Reveal observers ---------- */
  function observeReveals() {
    const nodes = $$("[data-reveal]");
    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
  }

  function observeEvents() {
    const blocks = $$(".event-block");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-inview");
        });
      },
      { threshold: 0.35 }
    );
    blocks.forEach((b) => io.observe(b));
  }

  /* ---------- Countdown ---------- */
  function startCountdown() {
    const target = new Date(cfg.date.iso).getTime();
    const units = {
      days: $('[data-unit="days"]'),
      hours: $('[data-unit="hours"]'),
      minutes: $('[data-unit="minutes"]'),
      seconds: $('[data-unit="seconds"]')
    };

    function tick() {
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours * 3600000;
      const minutes = Math.floor(diff / 60000);
      diff -= minutes * 60000;
      const seconds = Math.floor(diff / 1000);

      setUnit(units.days, pad(days));
      setUnit(units.hours, pad(hours));
      setUnit(units.minutes, pad(minutes));
      setUnit(units.seconds, pad(seconds));
    }

    function setUnit(el, value) {
      if (el.textContent !== value) {
        el.textContent = value;
        el.classList.remove("is-tick");
        void el.offsetWidth;
        el.classList.add("is-tick");
      }
    }

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Calendar ---------- */
  function setupCalendar() {
    $("#add-to-calendar").addEventListener("click", () => {
      const start = new Date(cfg.date.iso);
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
      const stamp = (d) =>
        d
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-The Wedding Story-",
        "BEGIN:VEVENT",
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${cfg.calendar.title}`,
        `DESCRIPTION:${cfg.calendar.details}`,
        `LOCATION:${cfg.calendar.location}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "arjun-meera-wedding.ics";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ---------- Lightbox ---------- */
  let lightboxIndex = 0;

  function setupLightbox() {
    const lb = $("#lightbox");
    $("#lightbox-close").addEventListener("click", closeLightbox);
    $("#lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    $("#lightbox-next").addEventListener("click", () => stepLightbox(1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });

    let touchX = null;
    lb.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    lb.addEventListener(
      "touchend",
      (e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].screenX - touchX;
        if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
        touchX = null;
      },
      { passive: true }
    );
  }

  function openLightbox(index) {
    lightboxIndex = index;
    const item = galleryItems[index];
    const img = $("#lightbox-image");
    img.src = item.src;
    img.alt = item.alt;
    $("#lightbox").hidden = false;
    document.body.style.overflow = "hidden";
    $("#lightbox-close").focus();
  }

  function closeLightbox() {
    $("#lightbox").hidden = true;
    document.body.style.overflow = "";
  }

  function stepLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + galleryItems.length) % galleryItems.length;
    const item = galleryItems[lightboxIndex];
    const img = $("#lightbox-image");
    img.style.animation = "none";
    void img.offsetWidth;
    img.style.animation = "";
    img.src = item.src;
    img.alt = item.alt;
  }

  /* ---------- RSVP ---------- */
  function setupRsvp() {
    const form = $("#rsvp-form");
    const note = $("#rsvp-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#guest-name").value.trim();
      const guests = $("#guest-count").value;
      const attending = $("#guest-attending").value;
      const message = $("#guest-message").value.trim();

      if (!name) {
        note.hidden = false;
        note.textContent = "Please share your name so we know who to welcome.";
        return;
      }

      const statusMap = {
        yes: "joyfully attending",
        no: "unable to attend",
        maybe: "hoping to attend"
      };

      const text = [
        `RSVP for ${cfg.couple.groom} & ${cfg.couple.bride}`,
        `Name: ${name}`,
        `Guests: ${guests}`,
        `Status: ${statusMap[attending]}`,
        message ? `Message: ${message}` : ""
      ]
        .filter(Boolean)
        .join("\n");

      const wa = `https://wa.me/${cfg.rsvp.whatsapp}?text=${encodeURIComponent(text)}`;
      note.hidden = false;
      note.textContent = "Thank you — opening WhatsApp to send your RSVP.";
      window.setTimeout(() => {
        window.open(wa, "_blank", "noopener");
      }, 600);
      form.reset();
      $("#guest-count").value = "1";
    });
  }

  /* ---------- Music ---------- */
  function setupMusic() {
    const audio = $("#wedding-audio");
    const btn = $("#music-btn");
    const eq = btn.querySelector(".eq");
    const speaker = btn.querySelector(".icon-speaker");

    if (cfg.music.src) {
      audio.src = cfg.music.src;
    }

    btn.addEventListener("click", async () => {
      if (!cfg.music.src) {
        btn.setAttribute("aria-label", "Add a music file in config.js");
        return;
      }
      try {
        if (audio.paused) {
          await audio.play();
          btn.setAttribute("aria-pressed", "true");
          btn.setAttribute("aria-label", "Pause music");
          if (speaker) speaker.hidden = true;
          if (eq) eq.hidden = false;
        } else {
          audio.pause();
          btn.setAttribute("aria-pressed", "false");
          btn.setAttribute("aria-label", "Play music");
          if (speaker) speaker.hidden = false;
          if (eq) eq.hidden = true;
        }
      } catch (_) {
        /* Autoplay policies — user gesture already present */
      }
    });
  }

  /* ---------- Subtle parallax ---------- */
  function setupParallax() {
    if (reduceMotion) return;
    const layers = [
      { el: $(".venue__hero img"), speed: 0.12 },
      { el: $(".finale__media img"), speed: 0.1 }
    ].filter((l) => l.el);

    window.addEventListener(
      "scroll",
      () => {
        const vh = window.innerHeight;
        layers.forEach(({ el, speed }) => {
          const rect = el.parentElement.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          const offset = (rect.top - vh * 0.2) * speed;
          el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Finale petals ---------- */
  function setupFinalePetals() {
    if (reduceMotion) return;
    const layer = $("#petal-layer");
    const finale = $("#finale");
    let active = false;
    let timer = null;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          active = entry.isIntersecting;
          if (active && !timer) {
            timer = window.setInterval(spawnPetal, 700);
          } else if (!active && timer) {
            clearInterval(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(finale);

    function spawnPetal() {
      if (!active) return;
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${7 + Math.random() * 6}s`;
      p.style.width = `${6 + Math.random() * 8}px`;
      p.style.height = `${8 + Math.random() * 10}px`;
      layer.appendChild(p);
      window.setTimeout(() => p.remove(), 14000);
    }
  }

  /* ---------- Init ---------- */
  populate();
  setupOpening();
  setupChrome();
  setupCalendar();
  setupLightbox();
  setupRsvp();
})();
