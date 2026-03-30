const body = document.body;
const siteHeader = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const gridToggle = document.getElementById("gridToggle");
const colorToggle = document.getElementById("colorToggle");
const accentThemes = ["orange", "fire", "ember"];

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setReadyState() {
  window.setTimeout(() => {
    body.classList.add("is-ready");
  }, 1200);
}

function syncHeader() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
}

function toggleMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : !body.classList.contains("menu-open");
  body.classList.toggle("menu-open", shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
  menuPanel.setAttribute("aria-hidden", String(!shouldOpen));
}

function buildRollingNumbers() {
  qsa(".rolling-number").forEach((number) => {
    const value = number.dataset.value ?? "";
    number.innerHTML = "";

    [...value].forEach((digit, index) => {
      const slot = document.createElement("span");
      slot.className = "digit-slot";
      slot.dataset.targetDigit = digit;
      slot.dataset.delayIndex = String(index);

      const track = document.createElement("span");
      track.className = "digit-track";

      for (let loop = 0; loop < 3; loop += 1) {
        for (let current = 0; current <= 9; current += 1) {
          const span = document.createElement("span");
          span.textContent = String(current);
          track.append(span);
        }
      }

      slot.append(track);
      number.append(slot);
    });
  });
}

function animateRollingNumber(slot) {
  const digit = Number(slot.dataset.targetDigit ?? "0");
  const track = qs(".digit-track", slot);
  const repeatsOffset = 10 + digit;
  const delayIndex = Number(slot.dataset.delayIndex ?? "0");
  track.style.transitionDelay = `${delayIndex * 0.08}s`;
  track.style.transform = `translateY(-${repeatsOffset}em)`;
}

function initObservers() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  qsa("[data-reveal]").forEach((element) => revealObserver.observe(element));

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        qsa(".digit-slot", entry.target).forEach((slot) => animateRollingNumber(slot));
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.45,
    }
  );

  qsa(".stat-card").forEach((card) => counterObserver.observe(card));
}

function initProcess() {
  const steps = qsa(".process-step");
  const previewFrame = qs(".process__preview");
  const track = previewFrame ? qs(".process__track", previewFrame) : null;
  const indicator = previewFrame ? qs(".process__indicator", previewFrame) : null;
  const slides = previewFrame ? qsa(".process-slide", previewFrame) : [];

  if (!steps.length || !previewFrame || !track || !indicator || !slides.length) {
    return;
  }

  let activeName = steps.find((step) => step.classList.contains("is-active"))?.dataset.processTarget;

  const syncPreviewMotion = (index) => {
    const frameHeight = previewFrame.clientHeight;
    const styles = window.getComputedStyle(previewFrame);
    const indicatorSize = Number.parseFloat(styles.getPropertyValue("--process-indicator-size")) || 48;
    const indicatorInset = Number.parseFloat(styles.getPropertyValue("--process-indicator-offset")) || 24;
    const availableTravel = Math.max(frameHeight - indicatorSize - indicatorInset * 2, 0);
    const progress = slides.length > 1 ? index / (slides.length - 1) : 0;

    track.style.transform = `translateY(-${index * frameHeight}px)`;
    indicator.style.transform = `translateY(${availableTravel * progress}px)`;
  };

  const setActive = (name) => {
    activeName = name;

    steps.forEach((step) => {
      step.classList.toggle("is-active", step.dataset.processTarget === name);
    });

    slides.forEach((slide, index) => {
      const isActive = slide.dataset.processPreview === name;
      slide.classList.toggle("is-active", isActive);

      if (isActive) {
        syncPreviewMotion(index);
      }
    });
  };

  steps.forEach((step) => {
    const name = step.dataset.processTarget;
    step.addEventListener("mouseenter", () => setActive(name));
    step.addEventListener("focus", () => setActive(name));
    step.addEventListener("click", () => setActive(name));
  });

  setActive(activeName ?? steps[0]?.dataset.processTarget);
  window.addEventListener("resize", () => {
    if (activeName) {
      setActive(activeName);
    }
  });
}

function initFeatured() {
  const buttons = qsa(".featured-nav__button");
  const cards = qsa("[data-project-card]");

  const setActive = (name) => {
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.project === name);
    });

    cards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.projectCard === name);
    });
  };

  buttons.forEach((button) => {
    const name = button.dataset.project;
    button.addEventListener("mouseenter", () => setActive(name));
    button.addEventListener("focus", () => setActive(name));
    button.addEventListener("click", () => setActive(name));
  });
}

function initFaq() {
  qsa(".faq-item").forEach((item) => {
    const trigger = qs(".faq-question", item);
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      qsa(".faq-item.is-open").forEach((openItem) => {
        openItem.classList.remove("is-open");
        qs(".faq-question", openItem)?.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function initUtilities() {
  gridToggle?.addEventListener("click", () => {
    const isVisible = body.classList.toggle("grid-visible");
    gridToggle.classList.toggle("is-active", isVisible);
    gridToggle.setAttribute("aria-pressed", String(isVisible));
  });

  colorToggle?.addEventListener("click", () => {
    const current = body.dataset.accentTheme ?? accentThemes[0];
    const currentIndex = accentThemes.indexOf(current);
    const next = accentThemes[(currentIndex + 1) % accentThemes.length];
    body.dataset.accentTheme = next;
    colorToggle.classList.add("is-active");
    colorToggle.setAttribute("aria-pressed", "true");
  });
}

function initMenu() {
  menuToggle?.addEventListener("click", () => toggleMenu());

  qsa("a", menuPanel).forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleMenu(false);
    }
  });
}

function init() {
  setReadyState();
  buildRollingNumbers();
  initObservers();
  initProcess();
  initFeatured();
  initFaq();
  initUtilities();
  initMenu();

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      return;
    }
    toggleMenu(false);
  });
}

document.addEventListener("DOMContentLoaded", init);
