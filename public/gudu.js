const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

const scrollRevealOption = {
  distance: "50px",
  origin: "bottom",
  duration: 1000,
};

ScrollReveal().reveal(".header__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".header__content h2", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".header__content h1", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".header__content .section__description", {
  ...scrollRevealOption,
  delay: 1500,
});

ScrollReveal().reveal(".header__form form", {
  ...scrollRevealOption,
  delay: 2000,
});

ScrollReveal().reveal(".about__card", {
  ...scrollRevealOption,
  interval: 500,
});

const tabs = document.querySelector(".deals__tabs");

tabs.addEventListener("click", (e) => {
  const tabContents = document.querySelectorAll(
    ".deals__container .tab__content"
  );
  Array.from(tabs.children).forEach((item) => {
    if (item.dataset.id === e.target.dataset.id) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
  tabContents.forEach((item) => {
    if (item.id === e.target.dataset.id) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
});

ScrollReveal().reveal(".choose__image img", {
  ...scrollRevealOption,
  origin: "left",
});
ScrollReveal().reveal(".choose__content .section__header", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".choose__content .section__description", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".choose__card", {
  duration: 1000,
  delay: 1500,
  interval: 500,
});

ScrollReveal().reveal(".subscribe__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".subscribe__content .section__header", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".subscribe__content .section__description", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".subscribe__content form", {
  ...scrollRevealOption,
  delay: 1500,
});

const swiper = new Swiper(".swiper", {
  slidesPerView: 3,
  spaceBetween: 20,
  loop: true,
});

// Day / Night Mode Switcher Logic
function setCarMode(mode) {
  const carImg = document.getElementById("hero-car-img");
  const dayBtn = document.getElementById("day-mode-btn");
  const nightBtn = document.getElementById("night-mode-btn");
  const navDayBtn = document.getElementById("nav-day-btn");
  const navNightBtn = document.getElementById("nav-night-btn");
  const headerImageContainer = document.querySelector(".header__image");

  if (!carImg) return;

  // Smooth animation trigger
  carImg.style.opacity = "0.2";
  carImg.style.transform = "scale(0.97)";

  setTimeout(() => {
    if (mode === "night") {
      carImg.src = "/scorpio_1.png";
      carImg.alt = "Scorpio N Night Mode";
      if (dayBtn) dayBtn.classList.remove("active");
      if (nightBtn) nightBtn.classList.add("active");
      if (navDayBtn) navDayBtn.classList.remove("active");
      if (navNightBtn) navNightBtn.classList.add("active");
      if (headerImageContainer) headerImageContainer.classList.add("night-mode");
      localStorage.setItem("carMode", "night");
    } else {
      carImg.src = "/scerpion_day.png";
      carImg.alt = "Scorpio N Day Mode";
      if (nightBtn) nightBtn.classList.remove("active");
      if (dayBtn) dayBtn.classList.add("active");
      if (navNightBtn) navNightBtn.classList.remove("active");
      if (navDayBtn) navDayBtn.classList.add("active");
      if (headerImageContainer) headerImageContainer.classList.remove("night-mode");
      localStorage.setItem("carMode", "day");
    }
    carImg.style.opacity = "1";
    carImg.style.transform = "scale(1)";
  }, 180);
}

// Restore saved mode on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedMode = localStorage.getItem("carMode") || "day";
  setCarMode(savedMode);
});

