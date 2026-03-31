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
  const section = qs(".process");
  const list = section ? qs(".process__list", section) : null;
  const steps = list ? qsa(".process-step", list) : [];
  const previewFrame = section ? qs(".process__preview", section) : null;
  const track = previewFrame ? qs(".process__track", previewFrame) : null;
  const indicator = list ? qs(".process__indicator", list) : null;
  const slides = previewFrame ? qsa(".process-slide", previewFrame) : [];
  const desktopMedia = window.matchMedia("(min-width: 961px)");

  if (!section || !list || !steps.length || !previewFrame || !track || !indicator || !slides.length) {
    return;
  }

  let activeIndex = Math.max(
    steps.findIndex((step) => step.classList.contains("is-active")),
    0
  );
  let rotationTurns = 0;
  let frameHandle = null;

  const getMaxIndex = () => Math.max(steps.length - 1, 0);

  const syncPreviewMotion = (index) => {
    const frameHeight = previewFrame.clientHeight;
    track.style.transform = `translateY(-${index * frameHeight}px)`;
  };

  const syncIndicator = (index, rotateSquare) => {
    const firstStep = steps[0];
    const currentStep = steps[index];

    if (!firstStep || !currentStep) {
      return;
    }

    if (rotateSquare) {
      rotationTurns += 1;
    }

    indicator.style.setProperty(
      "--process-indicator-y",
      `${currentStep.offsetTop - firstStep.offsetTop}px`
    );
    indicator.style.setProperty("--process-indicator-rotate", `${rotationTurns * 90}deg`);
  };

  const setActiveIndex = (index, options = {}) => {
    const nextIndex = Math.min(Math.max(index, 0), getMaxIndex());
    const changed = nextIndex !== activeIndex;

    activeIndex = nextIndex;

    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === nextIndex);
    });

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === nextIndex);
    });

    syncPreviewMotion(nextIndex);
    syncIndicator(nextIndex, changed && options.rotate !== false);
  };

  const getSectionProgress = () => {
    const rect = section.getBoundingClientRect();
    const scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
    const traveled = Math.min(Math.max(-rect.top, 0), scrollableDistance);

    return traveled / scrollableDistance;
  };

  const getIndexFromProgress = (progress) => {
    const maxIndex = getMaxIndex();

    if (maxIndex === 0 || progress < 1 / 6) {
      return 0;
    }

    const segmentProgress = (progress - 1 / 6) / (5 / 6);
    return Math.min(Math.floor(segmentProgress * maxIndex) + 1, maxIndex);
  };

  const getClickProgress = (index) => {
    const maxIndex = getMaxIndex();

    if (index <= 0 || maxIndex === 0) {
      return 1 / 12;
    }

    return 1 / 6 + ((5 / 6) / maxIndex) * (index - 0.5);
  };

  const syncFromScroll = () => {
    if (!desktopMedia.matches) {
      return;
    }

    setActiveIndex(getIndexFromProgress(getSectionProgress()));
  };

  const requestScrollSync = () => {
    if (frameHandle) {
      return;
    }

    frameHandle = window.requestAnimationFrame(() => {
      frameHandle = null;
      syncFromScroll();
    });
  };

  const scrollToIndex = (index) => {
    if (!desktopMedia.matches) {
      setActiveIndex(index, { rotate: false });
      return;
    }

    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
    const targetProgress = getClickProgress(index);

    window.scrollTo({
      top: sectionTop + scrollableDistance * targetProgress,
      behavior: "smooth",
    });
  };

  steps.forEach((step, index) => {
    step.addEventListener("click", () => scrollToIndex(index));
  });

  const handleResize = () => {
    if (!desktopMedia.matches) {
      track.style.removeProperty("transform");
      indicator.style.removeProperty("--process-indicator-y");
      indicator.style.removeProperty("--process-indicator-rotate");
      return;
    }

    setActiveIndex(activeIndex, { rotate: false });
    syncFromScroll();
  };

  setActiveIndex(activeIndex, { rotate: false });
  handleResize();

  window.addEventListener("scroll", requestScrollSync, { passive: true });
  window.addEventListener("resize", handleResize);

  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener("change", handleResize);
  } else {
    desktopMedia.addListener(handleResize);
  }
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
