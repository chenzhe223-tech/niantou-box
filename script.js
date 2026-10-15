/*
 * 念头盒官网：应用入口 + 真实快速记录。
 *
 * 这里的快速记录不是体验小样，而是真的把内容写进云端收件箱：
 *   1. 已经登录过 → 直接 POST 到云端 /capture（带 Bearer 令牌），成功才清空输入框；
 *   2. 还没登录   → 原文先留在本机（localStorage），引导去应用里登录，
 *                   登录成功后由应用自动补交到收件箱，不需要用户重写一遍；
 *   3. 提交失败   → 输入框里的原文一个字都不动，并如实说明失败原因。
 *
 * 为什么可以共用登录状态：官网（/niantou-box/）和应用（/niantou-box-app/）在
 * GitHub Pages 上属于同一个 origin，因此共用同一份 localStorage。
 *
 * 任何一步都不会把「没能提交」写成「已提交成功」。
 */
(() => {
  const config = window.NIANBOX_CONFIG || {};
  const appUrl = typeof config.appUrl === "string" ? config.appUrl : "";
  const appLabel = typeof config.appLabel === "string" ? config.appLabel : "打开念头盒";
  const appStatus = typeof config.appStatus === "string" ? config.appStatus : "";
  const cloudEndpoint = (typeof config.cloudEndpoint === "string" ? config.cloudEndpoint : "").replace(/\/+$/, "");

  const TOKEN_KEY = "nb.cloud.token.v1";
  const DRAFT_KEY = "nb.site.pending-capture.v1";
  const CAPTURE_MAX = 1200;

  const appReady = appStatus === "live" && appUrl !== "";
  const appLink = (hash) => (appReady ? appUrl.replace(/#.*$/, "") + (hash || "") : "");

  /* ── 本机读写：任何一次失败都不应该让页面崩掉 ────────────────── */
  function readLocal(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }
  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  function removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 存不进去就当没发生，不阻断页面 */
    }
  }

  const readToken = () => readLocal(TOKEN_KEY).trim();

  function readDraft() {
    const raw = readLocal(DRAFT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const content = parsed && typeof parsed.content === "string" ? parsed.content.trim() : "";
      if (!content) {
        removeLocal(DRAFT_KEY);
        return null;
      }
      const id = parsed && typeof parsed.id === "string" && parsed.id.trim() ? parsed.id.trim() : newDraftId();
      return { id, content, createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now() };
    } catch {
      removeLocal(DRAFT_KEY);
      return null;
    }
  }
  function saveDraft(content, id) {
    return writeLocal(
      DRAFT_KEY,
      JSON.stringify({ id: id || newDraftId(), content: content.slice(0, CAPTURE_MAX), createdAt: Date.now() }),
    );
  }
  function newDraftId() {
    const cryptoRef = window.crypto;
    if (cryptoRef && typeof cryptoRef.randomUUID === "function") return "idea_" + cryptoRef.randomUUID();
    return "idea_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  /* ── 应用入口：配置成 live 时才指向应用，否则留在本页 ────────── */
  const links = document.querySelectorAll("[data-app-link]");
  links.forEach((link) => {
    if (appReady) {
      link.href = appUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = appLabel || "打开念头盒 ↗";
    } else {
      link.href = "#capture";
      link.textContent = appLabel || "应用即将到来";
    }
  });

  /* ── 快速记录 ──────────────────────────────────────────────── */
  const form = document.getElementById("capture-form");
  const input = document.getElementById("thought-input");
  const count = document.getElementById("char-count");
  const feedback = document.getElementById("capture-feedback");
  const result = document.getElementById("saved-thoughts");
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  let busy = false;

  const updateCount = () => {
    if (count && input) count.textContent = input.value.length + " / " + CAPTURE_MAX;
  };

  function clearResult() {
    if (result) {
      result.hidden = true;
      result.replaceChildren();
    }
    if (feedback) feedback.textContent = "";
  }

  /**
   * 渲染提交结果。
   * 一律用 DOM 节点 + textContent 组装，用户写的内容永远不会被当成 HTML 解析。
   */
  function renderResult(state, options) {
    if (!result) return;
    const opts = options || {};
    result.hidden = false;
    result.replaceChildren();

    const box = document.createElement("div");
    box.className = "capture-state" + (opts.tone ? " capture-state--" + opts.tone : "");

    const title = document.createElement("p");
    title.className = "capture-state__title";
    title.textContent = opts.title || "";
    box.appendChild(title);

    if (opts.content) {
      const body = document.createElement("p");
      body.className = "capture-state__text";
      body.textContent = opts.content;
      box.appendChild(body);
    }

    if (opts.note) {
      const note = document.createElement("p");
      note.className = "capture-state__note";
      note.textContent = opts.note;
      box.appendChild(note);
    }

    const actions = opts.actions || [];
    if (actions.length > 0) {
      const bar = document.createElement("div");
      bar.className = "capture-state__actions";
      actions.forEach((action) => {
        if (action.href) {
          const a = document.createElement("a");
          a.className = "button " + (action.variant || "secondary");
          a.href = action.href;
          a.textContent = action.label;
          if (action.external) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
          bar.appendChild(a);
        } else if (typeof action.onClick === "function") {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "button " + (action.variant || "secondary");
          b.textContent = action.label;
          b.addEventListener("click", action.onClick);
          bar.appendChild(b);
        }
      });
      box.appendChild(bar);
    }

    result.appendChild(box);
    if (feedback) feedback.textContent = state || "";
  }

  function setBusy(next) {
    busy = next;
    if (submitButton) {
      submitButton.disabled = next;
      const label = submitButton.querySelector("[data-submit-label]");
      if (label) label.textContent = next ? "正在收进盒子…" : "先收进盒子";
    }
  }

  function askToSignIn(content) {
    const stored = saveDraft(content, (readDraft() || {}).id);
    renderResult(
      stored
        ? "这句话已经先放在这台设备上了，登录后会自动进你的收件箱。"
        : "登录之后，这句话会直接进你的收件箱。",
      {
        tone: "warn",
        title: "还差一步：先登录，再收进盒子",
        content,
        note: stored
          ? "原文保留在这台设备上。点下面的按钮去登录，登录完成后它会自动交上去，不用重写。"
          : "浏览器不让官网保存本地草稿（可能开了无痕模式），所以请先登录再提交，避免内容丢失。",
        actions: appReady
          ? [
              { label: "登录并收进盒子 ↗", href: appLink("#/cloud"), variant: "primary", external: true },
              { label: "打开念头盒 ↗", href: appUrl, variant: "secondary", external: true },
            ]
          : [],
      },
    );
  }

  async function submit(value) {
    const token = readToken();
    if (!token) {
      askToSignIn(value);
      return;
    }

    // 幂等键：优先复用草稿里的 id，重试不会在收件箱里多出一条。
    const existing = readDraft();
    const id = existing && existing.content === value ? existing.id : newDraftId();

    setBusy(true);
    if (feedback) feedback.textContent = "正在收进盒子…";
    if (result) {
      result.hidden = true;
      result.replaceChildren();
    }

    let response;
    try {
      response = await fetch(cloudEndpoint + "/capture", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ content: value, source: "website", id }),
      });
    } catch (error) {
      // 网络层失败：原文一个字都不动，同时留一份草稿等下次重试。
      saveDraft(value, id);
      setBusy(false);
      renderResult("网络似乎不太顺，这句话还留在这台设备上。", {
        tone: "warn",
        title: "没能送出去（网络中断）",
        content: value,
        note: "输入框里的原文没有被清空。检查网络后可以直接再点一次「先收进盒子」；登录状态下打开念头盒也会自动补交。",
        actions: appReady ? [{ label: "打开念头盒 ↗", href: appUrl, variant: "secondary", external: true }] : [],
      });
      return;
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    setBusy(false);

    if (response.ok && payload && payload.ok === true) {
      if (existing && existing.id === id) removeLocal(DRAFT_KEY);
      input.value = "";
      updateCount();
      renderResult("已经收进你的念头盒了。", {
        tone: "ok",
        title: "收好了：这条念头已经在你的收件箱里",
        content: value,
        note: payload.duplicate ? "识别为一次重复提交，没有产生第二条记录。" : "换一台设备登录同一个账号，也能看到它。",
        actions: appReady
          ? [
              { label: "去收件箱看 ↗", href: appLink("#/inbox"), variant: "primary", external: true },
              { label: "继续记下一个", href: "#capture", variant: "secondary" },
            ]
          : [],
      });
      input.focus();
      return;
    }

    if (response.status === 401 || response.status === 403) {
      // 令牌过期：原文保留，引导重新登录。
      saveDraft(value, id);
      renderResult("登录状态已经过期，这句话还留在这台设备上。", {
        tone: "warn",
        title: "需要重新登录",
        content: value,
        note: "重新登录后，这句话会自动交到你的收件箱，不需要重写。",
        actions: appReady
          ? [{ label: "重新登录 ↗", href: appLink("#/cloud"), variant: "primary", external: true }]
          : [],
      });
      return;
    }

    const detail = payload && typeof payload.error === "string" ? payload.error : "HTTP " + response.status;
    saveDraft(value, id);
    renderResult("这次没有保存成功，原文还留在输入框里。", {
      tone: "warn",
      title: "没能送出去",
      content: value,
      note: "服务端返回：" + detail + "。可以直接再点一次「先收进盒子」。",
      actions: appReady ? [{ label: "打开念头盒 ↗", href: appUrl, variant: "secondary", external: true }] : [],
    });
  }

  if (form && input) {
    input.addEventListener("input", updateCount);
    updateCount();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (busy) return;
      const value = input.value.trim();
      if (!value) {
        clearResult();
        if (feedback) feedback.textContent = "先写下一点点，再把它收进盒子吧。";
        input.focus();
        return;
      }
      void submit(value);
    });

    // 上次没交出去的那句话：自动填回输入框，不让它凭空消失。
    const pending = readDraft();
    if (pending) {
      input.value = pending.content;
      updateCount();
      const signedIn = readToken() !== "";
      renderResult("这句话还没有交出去。", {
        tone: "warn",
        title: "上次写下的一句话还在这台设备上",
        content: pending.content,
        note: signedIn
          ? "你现在是登录状态，直接点「先收进盒子」就会送进你的收件箱。"
          : "登录之后它会自动进入你的收件箱；也可以先修改内容再提交。",
        actions: signedIn
          ? appReady
            ? [{ label: "打开念头盒 ↗", href: appUrl, variant: "secondary", external: true }]
            : []
          : appReady
            ? [{ label: "登录并收进盒子 ↗", href: appLink("#/cloud"), variant: "primary", external: true }]
            : [],
      });
    }
  }

  /* ── 页脚年份与移动端菜单 ──────────────────────────────────── */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".topbar nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.textContent = open ? "×" : "☰";
    });
    nav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "☰";
      }),
    );
  }
})();