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
      feedback.textContent = "先写下一点点，再收进念头盒吧。";
      input.focus();
      return;
    }
    if (!config.appUrl || config.appStatus !== "live") {
      feedback.textContent = "正式应用暂时不可用，请稍后再试。";
      return;
    }
    // Transfer the original text directly to the app. The app saves it into its existing local inbox.
    // No content is sent to a third-party service; this is a same-user browser handoff.
    const destination = new URL(config.appUrl, window.location.href);
    destination.hash = "/capture?text=" + encodeURIComponent(value);
    feedback.textContent = "正在打开念头盒，并把这条念头交给应用保存……";
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    window.location.assign(destination.toString());
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
