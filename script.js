(() => {
  const config = window.NIANBOX_CONFIG || { appUrl: "", appLabel: "应用即将到来", appStatus: "coming-soon" };
  const links = document.querySelectorAll("[data-app-link]");
  links.forEach((link) => {
    if (config.appStatus === "live" && config.appUrl) {
      link.href = config.appUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = config.appLabel || "打开念头盒 ↗";
    } else {
      link.href = "#capture";
      link.textContent = config.appLabel || "应用即将到来";
    }
  });
  const form = document.getElementById("capture-form");
  const input = document.getElementById("thought-input");
  const count = document.getElementById("char-count");
  const feedback = document.getElementById("capture-feedback");
  const saved = document.getElementById("saved-thoughts");
  const updateCount = () => { count.textContent = input.value.length + " / 1200"; };
  input.addEventListener("input", updateCount);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      feedback.textContent = "先写下一点点，再把它收进盒子吧。";
      input.focus();
      return;
    }
    // This is a demo interaction, not the real NianBox app. The text stays in this page only.
    saved.hidden = false;
    saved.replaceChildren();
    const item = document.createElement("article");
    item.textContent = value;
    saved.appendChild(item);
    feedback.textContent = "接住了！这是官网体验小样，刷新页面后不会保留。";
    input.value = "";
    updateCount();
  });
  document.getElementById("year").textContent = String(new Date().getFullYear());
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".topbar nav");
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "×" : "☰";
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
  }));
})();
