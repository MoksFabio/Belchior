if (document.readyState === "complete") {
  document.body.classList.remove("is-loading");
} else {
  window.addEventListener("load", () => {
    document.body.classList.remove("is-loading");
  });
}

const splash = document.getElementById("splash");
if (splash) {
  let splashDuration = 5000;
  try {
    if (localStorage.getItem("belchior_visited")) {
      splashDuration = 3000;
    } else {
      localStorage.setItem("belchior_visited", "1");
    }
  } catch {}
  setTimeout(() => {
    splash.classList.add("is-done");
    setTimeout(() => splash.remove(), 750);
  }, splashDuration);
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollProgress = document.getElementById("scroll-progress");
const heroPhoto = document.querySelector(".hero-photo");
let scrollTicking = false;

function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollProgress && maxScroll > 0) {
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    scrollProgress.style.setProperty("--scroll-progress", progress.toFixed(4));
  }
  if (heroPhoto && !reducedMotion.matches) {
    const shift = Math.min(28, window.scrollY * 0.08);
    heroPhoto.style.setProperty("--hero-shift", `${shift.toFixed(1)}px`);
  }
  scrollTicking = false;
}

window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollEffects);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollEffects();

const discList = document.querySelector(".disc-list");
const carousel = document.querySelector("[data-carousel-controls]");
const [previousDisc, nextDisc] = carousel.querySelectorAll("button");

function updateCarousel() {
  const limit = discList.scrollWidth - discList.clientWidth;
  carousel.hidden = limit < 3;
  previousDisc.setAttribute("aria-disabled", discList.scrollLeft < 2);
  nextDisc.setAttribute("aria-disabled", discList.scrollLeft >= limit - 2);
}

carousel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-direction]");
  if (!button || button.getAttribute("aria-disabled") === "true") return;

  const [first, second] = discList.children;
  const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  discList.scrollBy({
    left: step * Number(button.dataset.direction),
    behavior: reducedMotion.matches ? "instant" : "smooth",
  });
  updateCarousel();
});

discList.addEventListener("scroll", updateCarousel, { passive: true });
if ("ResizeObserver" in window) {
  new ResizeObserver(updateCarousel).observe(discList);
} else {
  window.addEventListener("resize", updateCarousel);
}
updateCarousel();

for (const item of document.querySelectorAll(".timeline details")) {
  const [summary, panel] = item.children;
  if (!panel.animate) continue;

  let animation;
  summary.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const opening = !item.open || item.hasAttribute("data-closing");

    if (reducedMotion.matches) {
      if (!animation) return;
      event.preventDefault();
      animation.cancel();
      animation = undefined;
      item.open = opening;
      item.removeAttribute("data-closing");
      return;
    }

    event.preventDefault();
    const height = item.open ? panel.getBoundingClientRect().height : 0;
    const opacity = item.open ? getComputedStyle(panel).opacity : 0;
    animation?.cancel();
    item.open = true;
    item.toggleAttribute("data-closing", !opening);
    const targetHeight = opening ? panel.firstElementChild.getBoundingClientRect().height : 0;

    const transition = panel.animate([
      { height: `${height}px`, opacity },
      { height: `${targetHeight}px`, opacity: opening ? 1 : 0 },
    ], { duration: 260, easing: "cubic-bezier(.25,.7,.3,1)", fill: "both" });

    animation = transition;
    transition.onfinish = () => {
      if (animation !== transition) return;
      item.open = opening;
      item.removeAttribute("data-closing");
      transition.cancel();
      animation = undefined;
    };
  });
}

const revealTargets = document.querySelectorAll(".feature, .section, .site-footer");
if ("IntersectionObserver" in window) {
  const animationObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });

  revealTargets.forEach((section) => {
    animationObserver.observe(section);
  });
} else {
  revealTargets.forEach((section) => section.classList.add("is-visible"));
}

if (!reducedMotion.matches) {
  document.querySelectorAll(".disc-link, .feature-art").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const navLinks = [...document.querySelectorAll(".masthead nav a[href^='#']")];
const navIndicator = document.getElementById("nav-indicator");
const navSections = navLinks
  .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
  .filter((item) => item.target);

function moveNavIndicator(activeLink) {
  if (!navIndicator || !activeLink) return;
  navIndicator.style.width = `${activeLink.offsetWidth}px`;
  navIndicator.style.transform = `translateX(${activeLink.offsetLeft}px)`;
  navIndicator.style.opacity = "1";
}

if (navLinks.length) {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.toggle("is-active", l === link));
      moveNavIndicator(link);
    });
  });

  window.addEventListener("resize", () => {
    const current = navLinks.find((l) => l.classList.contains("is-active")) || navLinks[0];
    moveNavIndicator(current);
  }, { passive: true });
}

if ("IntersectionObserver" in window && navSections.length) {
  const spyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        navSections.forEach(({ link, target }) => {
          const active = target === entry.target;
          link.classList.toggle("is-active", active);
          if (active) moveNavIndicator(link);
        });
      }
    }
  }, { rootMargin: "-35% 0px -55% 0px" });

  navSections.forEach(({ target }) => spyObserver.observe(target));
}

const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 420);
  }, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
}

if (!reducedMotion.matches) {
  document.querySelectorAll(".platform").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${(e.clientX - rect.left).toFixed(1)}px`);
      btn.style.setProperty("--my", `${(e.clientY - rect.top).toFixed(1)}px`);
    });
  });

  if (discList) {
    let autoPlayPaused = false;
    const pauseAuto = () => { autoPlayPaused = true; };
    const resumeAuto = () => { autoPlayPaused = false; };
    discList.addEventListener("pointerenter", pauseAuto);
    discList.addEventListener("pointerleave", resumeAuto);
    discList.addEventListener("touchstart", pauseAuto, { passive: true });
    discList.addEventListener("focusin", pauseAuto);

    setInterval(() => {
      if (autoPlayPaused) return;
      const limit = discList.scrollWidth - discList.clientWidth;
      if (limit < 3) return;
      const step = discList.querySelector(".disc")?.offsetWidth || 260;
      const nextLeft = discList.scrollLeft + step + 16;
      discList.scrollTo({ left: nextLeft >= limit - 4 ? 0 : nextLeft, behavior: "smooth" });
    }, 3800);
  }
}

document.querySelectorAll(".platform").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (btn.classList.contains("is-launching")) return;
    btn.classList.add("is-launching");
    setTimeout(() => {
      btn.classList.remove("is-launching");
      window.location.href = btn.href;
    }, 2000);
  });
});

function typeElement(el, speed = 28) {
  return new Promise((resolve) => {
    const fullText = el.dataset.typeText;
    if (!fullText) return resolve();
    el.textContent = "";
    el.classList.add("is-typing");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      el.textContent = fullText.slice(0, i);
      if (i >= fullText.length) {
        clearInterval(timer);
        el.classList.remove("is-typing");
        resolve();
      }
    }, speed);
  });
}

if (!reducedMotion.matches) {
  const heroTexts = [...document.querySelectorAll("#hero-title, .hero-subtitle")];
  heroTexts.forEach((el) => {
    el.dataset.typeText = el.textContent.trim();
    el.textContent = "";
  });

  const runHeroType = async () => {
    for (const el of heroTexts) {
      await typeElement(el, el.id === "hero-title" ? 65 : 32);
    }
  };

  const splashEl = document.getElementById("splash");
  if (splashEl) {
    let waitMs = 5000;
    try {
      if (localStorage.getItem("belchior_visited")) waitMs = 3000;
    } catch {}
    setTimeout(runHeroType, waitMs + 200);
  } else {
    runHeroType();
  }

  const sectionTextSelector = ".listen h2, .feature-copy .eyebrow, .feature-copy h2, .feature-copy > p:not(.eyebrow), .section-heading h2, .section-heading p, .history-copy h2, .history-copy > p";
  const sectionTexts = [...document.querySelectorAll(sectionTextSelector)];
  sectionTexts.forEach((el) => {
    el.dataset.typeText = el.textContent.trim();
    el.textContent = "";
  });

  if ("IntersectionObserver" in window) {
    const typeObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeElement(entry.target, 22);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    sectionTexts.forEach((el) => typeObserver.observe(el));
  } else {
    sectionTexts.forEach((el) => { el.textContent = el.dataset.typeText; });
  }
}

const bioCarousel = document.getElementById("bio-carousel");
const bioTrack = document.getElementById("bio-track");
if (bioCarousel && bioTrack) {
  bioCarousel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bio-dir]");
    if (!btn) return;
    const dir = Number(btn.dataset.bioDir);
    const step = bioTrack.querySelector(".bio-slide")?.offsetWidth || 260;
    bioTrack.scrollBy({ left: dir * (step + 14), behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
}

const shareButton = document.querySelector(".share-button");
const shareStatus = document.querySelector("#share-status");
if (location.protocol.startsWith("http") && (navigator.share || navigator.clipboard?.writeText)) {
  const shareUrl = new URL(location.pathname, location.origin).href;
  shareButton.hidden = false;
  shareButton.addEventListener("click", async () => {
    shareStatus.textContent = "";
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: shareUrl });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      shareStatus.textContent = "Link copiado.";
    } catch {
      shareStatus.textContent = "Você pode copiar o endereço na barra do navegador.";
    }
  });
}
