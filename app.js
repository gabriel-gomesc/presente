(() => {
  const screenAsk = document.getElementById("screen-ask");
  const screenPoem = document.getElementById("screen-poem");
  const screenLily = document.getElementById("screen-lily");
  const btnYes = document.getElementById("btn-yes");
  const btnNo = document.getElementById("btn-no");
  const btnContinue = document.getElementById("btn-continue");
  const stanzas = [...document.querySelectorAll("[data-stanza]")];
  const lilySvg = document.getElementById("lily-svg");
  const lilyStage = document.querySelector(".lily-stage");
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");

  let noEscapes = 0;
  let canEscape = false;
  let isFleeing = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function safePad() {
    return {
      top: 16,
      right: 16,
      bottom: Math.max(24, 16 + (window.visualViewport?.offsetTop || 0)),
      left: 16,
    };
  }

  function moveNoAway() {
    const pad = safePad();
    const btnW = Math.max(btnNo.offsetWidth, 88);
    const btnH = Math.max(btnNo.offsetHeight, 48);
    const maxX = Math.max(pad.left, window.innerWidth - btnW - pad.right);
    const maxY = Math.max(pad.top, window.innerHeight - btnH - pad.bottom);
    const yesRect = btnYes.getBoundingClientRect();

    if (!isFleeing) {
      isFleeing = true;
      btnNo.classList.add("is-fleeing");
    }

    let x = pad.left;
    let y = pad.top;
    let tries = 0;

    do {
      x = pad.left + Math.random() * Math.max(0, maxX - pad.left);
      y = pad.top + Math.random() * Math.max(0, maxY - pad.top);
      tries += 1;
    } while (
      tries < 50 &&
      x < yesRect.right + 20 &&
      x + btnW > yesRect.left - 20 &&
      y < yesRect.bottom + 20 &&
      y + btnH > yesRect.top - 20
    );

    btnNo.style.left = `${clamp(x, pad.left, maxX)}px`;
    btnNo.style.top = `${clamp(y, pad.top, maxY)}px`;
  }

  function escapeNo(event) {
    if (!canEscape || btnNo.style.display === "none") return;
    event.preventDefault();
    event.stopPropagation();
    noEscapes += 1;

    if (noEscapes > 5) btnNo.textContent = "😅";
    if (noEscapes > 10) btnNo.textContent = "impossível";
    if (noEscapes > 16) btnNo.textContent = "só tem sim";

    moveNoAway();
  }

  function showScreen(next) {
    [screenAsk, screenPoem, screenLily].forEach((screen) => {
      screen.classList.remove("is-active");
      screen.hidden = true;
    });
    next.hidden = false;
    requestAnimationFrame(() => next.classList.add("is-active"));
  }

  async function revealPoem() {
    btnNo.style.display = "none";
    canEscape = false;
    showScreen(screenPoem);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const firstDelay = isMobile ? 500 : 700;
    const nextDelay = isMobile ? 1200 : 1600;

    for (const [index, stanza] of stanzas.entries()) {
      await wait(index === 0 ? firstDelay : nextDelay);
      stanza.classList.add("is-visible");
      stanza.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    await wait(900);
    btnContinue.hidden = false;
    btnContinue.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showLily() {
    showScreen(screenLily);
    window.scrollTo({ top: 0, behavior: "smooth" });
    lilyStage.classList.add("is-ready");
    requestAnimationFrame(() => lilySvg.classList.add("is-blooming"));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const particles = [];
  const PARTICLE_COUNT = window.matchMedia("(max-width: 720px)").matches ? 10 : 16;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle(randomY = false) {
    return {
      x: Math.random() * window.innerWidth,
      y: randomY ? Math.random() * window.innerHeight : -20,
      size: 3 + Math.random() * 7,
      speedY: 0.2 + Math.random() * 0.45,
      speedX: -0.2 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      spin: -0.01 + Math.random() * 0.02,
      alpha: 0.1 + Math.random() * 0.2,
    };
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = "#f2d2c5";
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function animatePetals() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.2;
      p.rotation += p.spin;
      if (p.y > window.innerHeight + 30) {
        Object.assign(p, spawnParticle(false), { y: -20 });
      }
      drawPetal(p);
    }
    requestAnimationFrame(animatePetals);
  }

  btnNo.addEventListener("pointerenter", escapeNo);
  btnNo.addEventListener("pointerdown", escapeNo);
  btnNo.addEventListener("click", escapeNo);
  btnYes.addEventListener("click", revealPoem);
  btnContinue.addEventListener("click", showLily);

  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  resizeCanvas();
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push(spawnParticle(true));
  }
  animatePetals();

  window.setTimeout(() => {
    canEscape = true;
  }, 400);
})();
