const discList = document.querySelector(".disc-list");
const carousel = document.querySelector("[data-carousel-controls]");
const [previousDisc, nextDisc] = carousel.querySelectorAll("button");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

if ("IntersectionObserver" in window) {
  const animationObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });

  document.querySelectorAll(".feature, .section").forEach((section) => {
    animationObserver.observe(section);
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
