/**
 * Nunik Co.
 * High-End Kinetic Engine (Vanilla JS)
 */

/* ================================================
   Shared module-level state
   ================================================ */
let webglUniforms = null;   // fluid background shader uniforms
let chakraMaterial = null;  // 3D chakra material reference

/* ================================================
   Theme palettes (fluid background colours)
   ================================================ */
const THEME_COLORS = {
    dark:  { base: "#111417", accent1: "#B45E45", accent2: "#2D4D4D" },
    // Light mode: warm tan second accent makes the fluid feel rich, not washed out
    light: { base: "#F8F6F3", accent1: "#B45E45", accent2: "#C3875A" }
};

/* ================================================
   Theme utilities
   ================================================ */
function isDark() {
    return document.documentElement.classList.contains("dark");
}

function applyThemeIcons() {
    // No-op: icon swap is now driven by CSS based on html.dark class.
    // Kept as a stub to avoid breaking call sites that invoke it.
}

function buildCalendlyURL() {
    const dark = isDark();
    const params = new URLSearchParams({
        hide_event_type_details: "1",
        hide_gdpr_banner: "1",
        background_color: dark ? "111417" : "f8f6f3",
        text_color: dark ? "e1e4e7" : "1b1e22",
        primary_color: "b45e45"
    });
    return `https://calendly.com/hello-nunik/ai-strategy-call?${params.toString()}`;
}

function mountCalendly() {
    const el = document.getElementById("calendly-widget");
    if (!el) return;
    el.setAttribute("data-url", buildCalendlyURL());
    el.innerHTML = "";
    if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
        window.Calendly.initInlineWidget({
            url: buildCalendlyURL(),
            parentElement: el,
            prefill: {},
            utm: {}
        });
    }
}

function remountCalendlyIfPresent() {
    if (document.getElementById("calendly-widget")) {
        // Defer so theme CSS variables settle, then rebuild the widget.
        setTimeout(mountCalendly, 50);
    }
}

function setWebGLTheme(animate) {
    if (!webglUniforms) return;
    const palette = isDark() ? THEME_COLORS.dark : THEME_COLORS.light;
    const target = {
        br:  new THREE.Color(palette.base).r,    bg:  new THREE.Color(palette.base).g,    bb:  new THREE.Color(palette.base).b,
        a1r: new THREE.Color(palette.accent1).r, a1g: new THREE.Color(palette.accent1).g, a1b: new THREE.Color(palette.accent1).b,
        a2r: new THREE.Color(palette.accent2).r, a2g: new THREE.Color(palette.accent2).g, a2b: new THREE.Color(palette.accent2).b
    };
    if (animate && typeof gsap !== "undefined") {
        const cur = {
            br:  webglUniforms.uColorBase.value.r,    bg:  webglUniforms.uColorBase.value.g,    bb:  webglUniforms.uColorBase.value.b,
            a1r: webglUniforms.uColorAccent1.value.r, a1g: webglUniforms.uColorAccent1.value.g, a1b: webglUniforms.uColorAccent1.value.b,
            a2r: webglUniforms.uColorAccent2.value.r, a2g: webglUniforms.uColorAccent2.value.g, a2b: webglUniforms.uColorAccent2.value.b
        };
        gsap.to(cur, {
            ...target, duration: 1.2, ease: "power2.inOut",
            onUpdate: () => {
                webglUniforms.uColorBase.value.setRGB(cur.br, cur.bg, cur.bb);
                webglUniforms.uColorAccent1.value.setRGB(cur.a1r, cur.a1g, cur.a1b);
                webglUniforms.uColorAccent2.value.setRGB(cur.a2r, cur.a2g, cur.a2b);
            }
        });
    } else {
        webglUniforms.uColorBase.value.set(palette.base);
        webglUniforms.uColorAccent1.value.set(palette.accent1);
        webglUniforms.uColorAccent2.value.set(palette.accent2);
    }
}

function setChakraTheme(animate) {
    if (!chakraMaterial) return;
    const targetHex = isDark() ? 0x2A2D32 : 0x545862;
    if (animate && typeof gsap !== "undefined" && typeof THREE !== "undefined") {
        const target = new THREE.Color(targetHex);
        const cur = { r: chakraMaterial.color.r, g: chakraMaterial.color.g, b: chakraMaterial.color.b };
        gsap.to(cur, {
            r: target.r, g: target.g, b: target.b,
            duration: 1.2, ease: "power2.inOut",
            onUpdate: () => { chakraMaterial.color.setRGB(cur.r, cur.g, cur.b); }
        });
    } else {
        chakraMaterial.color.set(targetHex);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (isDark()) {
        html.classList.remove("dark");
        localStorage.setItem("nunik-theme", "light");
    } else {
        html.classList.add("dark");
        localStorage.setItem("nunik-theme", "dark");
    }
    applyThemeIcons();
    setWebGLTheme(true);
    setChakraTheme(true);
    remountCalendlyIfPresent();
}

/* ================================================
   Main Init
   ================================================ */
document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);
    applyThemeIcons();

    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("theme-toggle-mobile")?.addEventListener("click", toggleTheme);

    // Calendly: mount when widget script is ready
    if (document.getElementById("calendly-widget")) {
        if (window.Calendly) {
            mountCalendly();
        } else {
            // Poll for Calendly to load (script is async)
            const t0 = Date.now();
            const tick = () => {
                if (window.Calendly) { mountCalendly(); return; }
                if (Date.now() - t0 < 8000) setTimeout(tick, 120);
            };
            tick();
        }
    }

    // ── Mobile nav ────────────────────────────────────
    const mobileNav = document.getElementById("mobile-nav");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    let mobileNavOpen = false;

    function closeMobileNav() {
        mobileNavOpen = false;
        mobileNav?.classList.remove("open");
        hamburgerBtn?.setAttribute("aria-expanded", "false");
    }

    hamburgerBtn?.addEventListener("click", () => {
        mobileNavOpen = !mobileNavOpen;
        mobileNav?.classList.toggle("open", mobileNavOpen);
        hamburgerBtn?.setAttribute("aria-expanded", String(mobileNavOpen));
    });

    // Close mobile nav on any link click
    mobileNav?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMobileNav);
    });

    // ── Lenis smooth scroll ───────────────────────────
    let lenis = null;
    try {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    } catch (e) {
        console.warn("Lenis failed, falling back to native scroll.", e);
    }

    // Anchor smooth scroll (generic handler, Connect overridden below)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            closeMobileNav();
            const id = this.getAttribute("href");
            if (id === "#") {
                if (lenis) lenis.scrollTo(0, { duration: 1.5 });
                else window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const target = document.querySelector(id);
            if (!target) return;
            if (lenis) {
                lenis.scrollTo(target, { offset: -80, duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            } else {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // ── Custom cursor (desktop only) ──────────────────
    const cursor = document.getElementById("custom-cursor");
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    if (!isTouch && cursor) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let cursorX = mouseX, cursorY = mouseY;
        window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        (function updateCursor() {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(updateCursor);
        })();
        document.querySelectorAll(".nav-link, a, button, .hoverable-glass").forEach(el => {
            el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
        });
        document.querySelectorAll(".cursor-project").forEach(el => {
            el.addEventListener("mouseenter", () => { cursor.classList.remove("hovering"); cursor.classList.add("view-project"); });
            el.addEventListener("mouseleave", () => { cursor.classList.remove("view-project"); });
        });
    }

    // ── Hero 3D kinetic typography (brand wordmark SVG, per-path tilt) ──
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
        const wordmarkSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="180 465 700 145" fill="currentColor" role="img" aria-label="Nunik Co. logo, AI agency in Australia" class="hero-wordmark">
  <path class="char char-swoosh" fill="var(--accent)" d="M749.4,560.9c0.9,1.4,2,2.8,2.8,4.3c9.6,17.8,23.3,30.9,43.1,36.5c12.6,3.5,25.2,3.9,37.1-2.7c5.9-3.3,10.5-8,11.9-15.1c0.8-3.8-0.1-7-2.4-10c-3.4-4.3-4.3-9.3-3.1-14.6c1.6-7.1,7.4-11.5,14.4-11c6.1,0.4,10.4,5.3,11.2,12.5c1.7,15.3-6.8,30.2-21.3,38.6c-23.2,13.4-55.2,7.9-74.2-9.6c-7.8-7.2-14.2-15.6-19.2-24.9c-0.6-1-1-2.1-1.5-3.2C748.6,561.4,749,561.2,749.4,560.9z"/>
  <path class="char char-N" d="M298.2,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V569c-0.5,0-1,0-1.5,0c-0.5,0-1,0-1.5,0l-55.4-85.6v69.6c0,3.2,0.3,5.7,0.9,7.5c0.6,1.8,1.7,3.1,3.4,3.8c1.7,0.7,4.3,1.2,7.7,1.4v2.6c-1.6-0.2-3.6-0.3-6.2-0.3c-2.6,0-5-0.1-7.3-0.1c-2.2,0-4.4,0-6.7,0.1c-2.2,0-4.1,0.2-5.6,0.3v-2.6c3-0.2,5.3-0.6,6.8-1.4c1.5-0.7,2.6-2,3.1-3.8c0.5-1.8,0.8-4.3,0.8-7.5V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.5,0.1,3.4,0.2,5.6,0.3c2.2,0.1,4.5,0.1,6.7,0.1c1.9,0,3.8,0,5.5-0.1c1.8-0.1,3.3-0.2,4.7-0.3l46.6,71.8v-56.5c0-3.3-0.3-5.8-0.9-7.5c-0.6-1.8-1.7-3-3.4-3.8c-1.7-0.8-4.3-1.2-7.7-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C295,475.2,296.8,475.1,298.2,475z"/>
  <path class="char char-u" d="M389.4,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V530c0,6.2-0.4,11.5-1.2,16.1c-0.8,4.6-2.2,8.5-4.2,11.9c-2.2,3.7-5.4,6.7-9.6,8.9c-4.2,2.2-9.1,3.4-14.5,3.4c-4.2,0-8.2-0.5-12.1-1.5s-7.2-2.9-10.1-5.6c-2.6-2.5-4.6-5.1-6-7.8c-1.5-2.7-2.4-6.1-3-10c-0.5-4-0.8-8.9-0.8-14.9V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1c3-0.1,5.6-0.2,7.6-0.3v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v43.7c0,4.5,0.2,8.7,0.7,12.7c0.4,4,1.3,7.5,2.7,10.6c1.4,3,3.5,5.4,6.3,7.1c2.8,1.7,6.5,2.6,11.2,2.6c6.7,0,11.8-1.5,15.5-4.4c3.6-2.9,6.2-7,7.7-12.2c1.5-5.2,2.2-11,2.2-17.5v-41.2c0-3.3-0.4-5.8-1.1-7.5c-0.7-1.8-2-3-3.8-3.8c-1.8-0.8-4.1-1.2-7.1-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C386.1,475.2,388,475.1,389.4,475z"/>
  <path class="char char-n" d="M481.3,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V569c-0.5,0-1,0-1.5,0c-0.5,0-1,0-1.5,0l-55.4-85.6v69.6c0,3.2,0.3,5.7,0.9,7.5c0.6,1.8,1.7,3.1,3.4,3.8c1.7,0.7,4.3,1.2,7.7,1.4v2.6c-1.6-0.2-3.6-0.3-6.2-0.3c-2.6,0-5-0.1-7.3-0.1c-2.2,0-4.4,0-6.7,0.1c-2.2,0-4.1,0.2-5.6,0.3v-2.6c3-0.2,5.3-0.6,6.8-1.4c1.5-0.7,2.6-2,3.1-3.8c0.5-1.8,0.8-4.3,0.8-7.5V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.5,0.1,3.4,0.2,5.6,0.3c2.2,0.1,4.5,0.1,6.7,0.1c1.9,0,3.8,0,5.5-0.1c1.8-0.1,3.3-0.2,4.7-0.3l46.6,71.8v-56.5c0-3.3-0.3-5.8-0.9-7.5c-0.6-1.8-1.7-3-3.4-3.8c-1.7-0.8-4.3-1.2-7.7-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C478.1,475.2,479.9,475.1,481.3,475z"/>
  <path class="char char-i" d="M525.2,475v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v65.4c0,3.2,0.3,5.5,0.8,7.1c0.5,1.6,1.6,2.6,3.1,3.2c1.5,0.5,3.8,0.9,6.8,1.1v2.6c-2-0.2-4.6-0.3-7.6-0.3c-3,0-6.1-0.1-9.2-0.1c-3.4,0-6.6,0-9.6,0.1c-3,0-5.4,0.2-7.3,0.3v-2.6c3-0.2,5.3-0.5,6.8-1.1c1.5-0.5,2.6-1.6,3.1-3.2c0.5-1.6,0.8-4,0.8-7.1V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1C520.7,475.2,523.2,475.1,525.2,475z"/>
  <path class="char char-k" d="M570,475v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v65.4c0,3.2,0.3,5.5,0.8,7.1c0.5,1.6,1.6,2.6,3.1,3.2c1.5,0.5,3.8,0.9,6.8,1.1v2.6c-2-0.2-4.6-0.3-7.6-0.3c-3,0-6.1-0.1-9.2-0.1c-3.4,0-6.6,0-9.6,0.1c-3,0-5.4,0.2-7.3,0.3v-2.6c3-0.2,5.3-0.5,6.8-1.1c1.5-0.5,2.6-1.6,3.1-3.2c0.5-1.6,0.8-4,0.8-7.1V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1C565.4,475.2,567.9,475.1,570,475z M611.9,475v2.6c-2.7,0.4-5.4,1.2-7.9,2.6c-2.6,1.4-5.1,3.7-7.7,7l-25.5,32.6l2.9-6.5l31.7,44.3c1.5,2.2,3.1,3.9,4.9,5.1c1.8,1.2,4,2.2,6.7,2.9v2.6c-2.1-0.2-4.7-0.3-7.8-0.3c-3.1,0-5.8-0.1-8-0.1c-1.5,0-3.3,0-5.5,0.1c-2.2,0-4.9,0.2-8.1,0.3v-2.6c3-0.2,4.9-0.7,5.7-1.6c0.8-0.9,0.5-2.3-0.9-4.4l-19.3-29c-1.8-2.7-3.3-4.8-4.7-6.1c-1.4-1.4-2.8-2.3-4.2-2.7c-1.5-0.4-3.3-0.7-5.5-0.8v-2.6c3.7-0.1,6.8-0.8,9.3-2.2c2.5-1.4,4.6-3.1,6.3-5.2L587,495c2.9-3.7,4.9-6.8,5.9-9.4c1.1-2.5,1-4.5-0.1-5.9c-1.1-1.4-3.6-2.1-7.3-2.2V475c1.7,0.1,3.4,0.2,5.1,0.2c1.8,0,3.5,0.1,5.2,0.1c1.7,0,3.3,0.1,4.8,0.1c2.3,0,4.4,0,6.3-0.1C609,475.2,610.6,475.1,611.9,475z"/>
  <path class="char char-C" fill="var(--accent)" d="M699,473.1c5.8,0,10.6,0.9,14.3,2.6c3.7,1.7,7.1,3.7,10,6c1.8,1.3,3.1,1.5,4,0.5c0.9-1,1.6-3.4,1.9-7.2h3c-0.2,3.3-0.3,7.2-0.4,11.9c-0.1,4.7-0.1,10.8-0.1,18.5h-3c-0.6-3.8-1.2-6.8-1.7-9c-0.5-2.2-1.2-4.2-1.9-5.7c-0.7-1.6-1.7-3.2-3-4.7c-2.7-3.6-6.2-6.2-10.3-7.8c-4.1-1.6-8.5-2.4-13.1-2.4c-4.3,0-8.2,1.1-11.7,3.2c-3.5,2.2-6.5,5.3-9,9.3c-2.5,4-4.4,8.9-5.8,14.6c-1.4,5.7-2,12.1-2,19.3c0,7.4,0.7,13.9,2.2,19.6c1.5,5.7,3.6,10.4,6.3,14.3c2.7,3.9,5.8,6.8,9.5,8.8c3.6,2,7.6,3,11.8,3c4,0,8.1-0.8,12.4-2.4c4.3-1.6,7.7-4.1,10.2-7.7c1.9-2.5,3.3-5.3,4-8.3c0.7-3,1.4-7.2,2-12.5h3c0,8,0,14.4,0.1,19.3c0.1,4.9,0.2,9,0.4,12.3h-3c-0.4-3.8-0.9-6.2-1.8-7.1c-0.8-1-2.2-0.8-4.2,0.4c-3.3,2.3-6.7,4.3-10.4,6c-3.6,1.7-8.3,2.6-14,2.6c-8.4,0-15.7-1.9-22-5.7c-6.3-3.8-11.2-9.2-14.6-16.4c-3.5-7.1-5.2-15.7-5.2-25.7c0-9.8,1.8-18.5,5.4-25.9c3.6-7.4,8.6-13.1,14.8-17.3C683.5,475.2,690.8,473.1,699,473.1z"/>
  <path class="char char-o" fill="var(--accent)" d="M789.7,473.1c8.4,0,15.7,1.9,22,5.7c6.3,3.8,11.2,9.2,14.6,16.3c3.5,7.1,5.2,15.7,5.2,25.8c0,9.8-1.8,18.5-5.3,25.9c-3.6,7.4-8.5,13.1-14.8,17.3c-6.3,4.1-13.6,6.2-21.8,6.2c-8.4,0-15.7-1.9-22-5.7c-6.3-3.8-11.2-9.2-14.6-16.4c-3.5-7.1-5.2-15.7-5.2-25.7c0-9.8,1.8-18.5,5.4-25.9c3.6-7.4,8.6-13.1,14.8-17.3C774.3,475.2,781.5,473.1,789.7,473.1z M789.2,475.5c-5.7,0-10.7,2-14.9,5.9c-4.2,4-7.5,9.4-9.8,16.4c-2.3,6.9-3.5,15-3.5,24.1c0,9.3,1.3,17.4,3.9,24.3c2.6,6.9,6.1,12.2,10.6,16c4.4,3.7,9.3,5.6,14.7,5.6c5.7,0,10.7-2,14.9-5.9c4.2-4,7.5-9.4,9.8-16.4c2.3-7,3.5-15,3.5-24.1c0-9.4-1.3-17.5-3.9-24.4c-2.6-6.9-6.1-12.2-10.5-15.9C799.6,477.4,794.6,475.5,789.2,475.5z"/>
  <path class="char char-dot" fill="var(--accent)" d="M852.4,553.3c2.3,0,4.3,0.8,5.9,2.5c1.7,1.7,2.5,3.7,2.5,5.9c0,2.3-0.8,4.3-2.5,5.9c-1.7,1.7-3.6,2.5-5.9,2.5c-2.3,0-4.3-0.8-5.9-2.5c-1.7-1.7-2.5-3.6-2.5-5.9c0-2.3,0.8-4.3,2.5-5.9C848.1,554.2,850.1,553.3,852.4,553.3z"/>
</svg>`;
        heroTitle.innerHTML = wordmarkSVG;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!isTouch && !prefersReducedMotion) {
            const chars = heroTitle.querySelectorAll(".char");
            heroTitle.addEventListener("mousemove", (e) => {
                heroTitle.style.animationPlayState = "paused";
                const rect = heroTitle.getBoundingClientRect();
                const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
                const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
                chars.forEach((char, i) => {
                    const cr = char.getBoundingClientRect();
                    const dx = (e.clientX - (cr.left + cr.width / 2)) / rect.width;
                    const dy = (e.clientY - (cr.top + cr.height / 2)) / rect.height;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    gsap.to(char, {
                        x: nx * -30 * (1 - i / chars.length),
                        y: ny * 15,
                        z: Math.max(0, 1 - dist * 2) * 80,
                        rotateX: ny * -8,
                        rotateY: nx * 12,
                        duration: 0.6,
                        ease: "power2.out"
                    });
                });
            });
            heroTitle.addEventListener("mouseleave", () => {
                heroTitle.style.animationPlayState = "running";
                gsap.to(chars, { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
            });
        }
    }

    // ── Scroll-triggered typographic header lockup ────
    const brandLockup = document.querySelector(".brand-lockup");
    const heroSection = document.querySelector("section.min-h-screen");
    if (brandLockup && heroSection) {
        ScrollTrigger.create({
            trigger: heroSection,
            start: "bottom 85%",
            end: "bottom top",
            onEnter:     () => brandLockup.classList.remove("is-hidden"),
            onLeaveBack: () => brandLockup.classList.add("is-hidden"),
        });

        if (!isTouch) {
            const brandType = brandLockup.querySelector(".brand-type");
            brandLockup.addEventListener("mousemove", (e) => {
                const r = brandLockup.getBoundingClientRect();
                const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                gsap.to(brandType, {
                    rotateX: ny * -10,
                    rotateY: nx * 14,
                    duration: 0.5,
                    ease: "power2.out",
                });
            });
            brandLockup.addEventListener("mouseleave", () => {
                gsap.to(brandType, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
            });
        }
    }

    // ── ScrollTrigger reveals ─────────────────────────
    document.querySelectorAll(".reveal-container").forEach(container => {
        const items = container.querySelectorAll(".reveal-item");
        gsap.set(items, { y: 60, opacity: 0 });
        ScrollTrigger.create({
            trigger: container,
            start: "top 88%",
            onEnter: () => gsap.to(items, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }),
            once: true
        });
    });

    // ── Parallax imagery ──────────────────────────────
    document.querySelectorAll(".parallax-img").forEach(img => {
        gsap.to(img, {
            yPercent: 20, ease: "none",
            scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
        });
    });

    // ── Contact / Terminal reveal ─────────────────────
    const initiateBtn = document.getElementById("initiate-btn");
    const contactExpansion = document.getElementById("contact-expansion");
    const terminalBoot = document.getElementById("terminal-boot");
    const terminalForm = document.getElementById("terminal-form");
    let protocolInitiated = false;

    function typeTerminalLine(text, color, parent) {
        return new Promise(resolve => {
            const line = document.createElement("p");
            line.style.color = color;
            parent.appendChild(line);
            let i = 0;
            (function type() {
                if (i < text.length) { line.textContent += text.charAt(i); i++; setTimeout(type, 18); }
                else resolve();
            })();
        });
    }

    function getThemeColor(v) {
        return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    }

    function expandAndBoot() {
        gsap.to(contactExpansion, {
            height: "auto", opacity: 1, paddingTop: "2rem", paddingBottom: "2rem",
            duration: 0.6, ease: "power3.inOut", onComplete: runBootSequence
        });
    }

    async function runBootSequence() {
        if (!terminalBoot || !terminalForm) return;
        terminalBoot.innerHTML = "";
        const accent = getThemeColor("--accent");
        const muted  = getThemeColor("--text-muted");
        const green  = getThemeColor("--terminal-green");

        await typeTerminalLine("> Initiating transformation protocol...", accent, terminalBoot);
        await new Promise(r => setTimeout(r, 400));
        await typeTerminalLine("> Loading secure data link...", muted, terminalBoot);
        await new Promise(r => setTimeout(r, 300));
        await typeTerminalLine("> Preparing interface...", muted, terminalBoot);
        await new Promise(r => setTimeout(r, 500));

        for (const c of ["3", "2", "1"]) {
            const el = document.createElement("p");
            el.style.color = accent;
            el.textContent = c;
            terminalBoot.appendChild(el);
            gsap.fromTo(el, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
            await new Promise(r => setTimeout(r, 600));
            gsap.to(el, { opacity: 0.3, duration: 0.2 });
        }

        await new Promise(r => setTimeout(r, 200));
        await typeTerminalLine("> CONNECTION ESTABLISHED.", green, terminalBoot);
        await new Promise(r => setTimeout(r, 300));
        gsap.to(terminalForm, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
        if (lenis) lenis.scrollTo(contactExpansion, { duration: 1.2, offset: -80, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    }

    function triggerProtocol() {
        if (protocolInitiated) return;
        protocolInitiated = true;
        if (initiateBtn) {
            gsap.to(initiateBtn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => { initiateBtn.style.pointerEvents = "none"; } });
        }
        const connectSection = document.getElementById("connect");
        if (lenis) lenis.scrollTo(connectSection || contactExpansion, { duration: 1.5, offset: 0 });
        setTimeout(expandAndBoot, 1600);
    }

    initiateBtn?.addEventListener("click", triggerProtocol);

    // Hide Initiate button when footer scrolls into view
    const connectFooter = document.getElementById("connect");
    if (connectFooter && initiateBtn) {
        const footerObs = new IntersectionObserver(
            ([entry]) => initiateBtn.classList.toggle("footer-visible", entry.isIntersecting),
            { threshold: 0.06 }
        );
        footerObs.observe(connectFooter);
    }

    // Connect nav links trigger protocol on first visit
    document.querySelectorAll('a[href="#connect"]').forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            closeMobileNav();
            if (protocolInitiated) {
                if (lenis) lenis.scrollTo("#connect", { offset: 0, duration: 1.5 });
                else document.querySelector("#connect")?.scrollIntoView({ behavior: "smooth" });
                return;
            }
            triggerProtocol();
        });
    });

    // ── Form submission to hello@nunik.co ─────────────
    // Using Web3Forms (web3forms.com, free, no backend needed).
    // 1. Go to web3forms.com and enter hello@nunik.co to get your access key.
    // 2. Replace "YOUR_WEB3FORMS_ACCESS_KEY" below with that key.
    // Until then, the form falls back to opening your mail client.
    const FORM_ACCESS_KEY = "17a1f44f-2499-4c3e-ba1a-7714fb693c59";

    if (terminalForm) {
        terminalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitLabel  = terminalForm.querySelector(".tracking-widest");
            const cursorPulse  = terminalForm.querySelector(".animate-pulse");
            const green        = getThemeColor("--terminal-green");
            const accentColor  = getThemeColor("--accent");

            if (FORM_ACCESS_KEY && FORM_ACCESS_KEY !== "YOUR_WEB3FORMS_ACCESS_KEY") {
                // POST to Web3Forms
                submitLabel.textContent = "[ TRANSMITTING... ]";
                if (cursorPulse) cursorPulse.style.display = "none";

                try {
                    const formData = new FormData(terminalForm);
                    formData.append("access_key", FORM_ACCESS_KEY);
                    formData.append("subject", `New Inquiry from ${formData.get("name") || "Website"} | nunik.co`);
                    formData.append("from_name", "Nunik Co. Website");

                    const res = await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        body: formData,
                        headers: { "Accept": "application/json" }
                    });

                    if (res.ok) {
                        const line = document.createElement("p");
                        line.style.color = green;
                        line.textContent = "> TRANSMISSION COMPLETE. We will be in touch shortly.";
                        terminalBoot.appendChild(line);
                        submitLabel.textContent = "[ TRANSMITTED ]";
                        terminalForm.reset();
                    } else {
                        throw new Error("failed");
                    }
                } catch {
                    submitLabel.textContent = "[ TRANSMIT_DATA ]";
                    if (cursorPulse) cursorPulse.style.display = "";
                    const line = document.createElement("p");
                    line.style.color = accentColor;
                    line.textContent = "> ERROR: Transmission failed. Email hello@nunik.co directly.";
                    terminalBoot.appendChild(line);
                }
            } else {
                // Fallback: mailto
                const d = Object.fromEntries(new FormData(terminalForm).entries());
                const body = [
                    `Name: ${d.name || ""}`,
                    `Phone: ${d.phone || ""}`,
                    `Website: ${d.website || ""}`,
                    `Business: ${d.business || ""}`,
                    `Service: ${d.service || ""}`,
                    ``,
                    `${d.message || ""}`
                ].join("\n");
                window.location.href = `mailto:hello@nunik.co?subject=${encodeURIComponent(`New Inquiry | ${d.service || "nunik.co"}`)}&body=${encodeURIComponent(body)}`;
            }
        });
    }

    // ── Launch WebGL systems ──────────────────────────
    if (typeof THREE !== "undefined") {
        initWebGLBackground(lenis);
        initChakraBackground(lenis);
    }
});

/* ================================================
   Fluid WebGL Background (original GLSL shader)
   ================================================ */
function initWebGLBackground(lenis) {
    const container = document.getElementById("webgl-background");
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const palette = isDark() ? THEME_COLORS.dark : THEME_COLORS.light;
    const uniforms = {
        uTime:         { value: 0.0 },
        uScroll:       { value: 0.0 },
        uColorBase:    { value: new THREE.Color(palette.base) },
        uColorAccent1: { value: new THREE.Color(palette.accent1) },
        uColorAccent2: { value: new THREE.Color(palette.accent2) }
    };
    webglUniforms = uniforms;

    const vertexShader = `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3  uColorBase;
        uniform vec3  uColorAccent1;
        uniform vec3  uColorAccent2;
        uniform float uScroll;
        varying vec2  vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p  = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
            vec3 m  = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
            vec3 h  = abs(x_) - 0.5;
            vec3 ox = floor(x_ + 0.5);
            vec3 a0 = x_ - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x   + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2  uv   = vUv;
            float time = uTime * 0.025 + uScroll * 0.001;
            vec2  np   = uv * 2.0;
            float n1 = snoise(np + vec2(time, time * 0.5));
            float n2 = snoise(np * 2.0 - vec2(time * 0.8, time * 1.2));
            float n3 = snoise(np * 4.0 + vec2(time * 2.0, time));
            float cn = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
            vec3  color = mix(uColorBase, uColorAccent2, cn * 0.6);
            float sn    = snoise(uv * 3.0 + vec2(-time, time));
            color = mix(color, uColorAccent1, smoothstep(0.7, 1.0, cn * sn));
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    );
    scene.add(mesh);

    let currentScroll = 0;
    if (lenis) lenis.on("scroll", (e) => { currentScroll = e.animatedScroll; });

    const clock = new THREE.Clock();
    (function animate() {
        requestAnimationFrame(animate);
        uniforms.uTime.value   = clock.getElapsedTime();
        uniforms.uScroll.value += (currentScroll - uniforms.uScroll.value) * 0.1;
        renderer.render(scene, camera);
    })();

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ================================================
   3D Sudarshana Chakra, scroll-driven traversal
   ================================================ */
function initChakraBackground(lenis) {
    const container = document.getElementById("chakra-canvas");
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1 : 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Material
    chakraMaterial = new THREE.MeshStandardMaterial({
        color: isDark() ? 0x2A2D32 : 0x545862,
        metalness: 0.9,
        roughness: 0.3
    });

    // 3-point lighting
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    keyLight.position.set(5, 8, 3);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    rimLight.position.set(-3, -2, -5);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.15));

    // Build Chakra compound group
    const chakraGroup = new THREE.Group();

    // Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8), chakraMaterial);
    hub.rotation.x = Math.PI / 2;
    chakraGroup.add(hub);

    // 6 concentric rings
    for (let i = 1; i <= 6; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.15, 0.015, 16, 64), chakraMaterial);
        ring.rotation.x = Math.PI / 2;
        chakraGroup.add(ring);
    }

    // 108 serrated teeth
    for (let i = 0; i < 108; i++) {
        const angle = (i / 108) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 3), chakraMaterial);
        tooth.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0);
        tooth.rotation.z = angle + Math.PI / 2;
        chakraGroup.add(tooth);
    }

    // 12 lotus petals
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.01), chakraMaterial);
        petal.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0);
        petal.rotation.z = angle;
        chakraGroup.add(petal);
    }

    scene.add(chakraGroup);

    // Scroll-driven waypoints (normalised 0-1 scroll progress)
    // x/y in Three.js world units, s = scale, rx = rotation.x tilt
    const waypoints = [
        { t: 0.00, x:  1.5,  y:  0.3,  s: 1.4, rx: 0.08 },  // Hero: right
        { t: 0.12, x: -2.4,  y:  0.1,  s: 1.2, rx: 0.15 },  // Philosophy: far left
        { t: 0.27, x:  0.0,  y:  0.0,  s: 2.2, rx: 0.22 },  // Yukti: centre, zoomed
        { t: 0.42, x:  2.4,  y: -0.2,  s: 1.3, rx: 0.05 },  // Rasa: far right
        { t: 0.57, x: -2.0,  y:  0.2,  s: 1.6, rx: 0.18 },  // Artha: left
        { t: 0.72, x:  1.0,  y: -0.3,  s: 1.0, rx: 0.08 },  // Archive: right-ish
        { t: 0.87, x: -0.4,  y:  0.2,  s: 1.2, rx: 0.12 },  // Research: centre-left
        { t: 1.00, x:  0.0,  y:  0.0,  s: 1.1, rx: 0.10 },  // Connect: centre
    ];

    // Lerp state
    let curX = waypoints[0].x, curY = waypoints[0].y, curS = waypoints[0].s, curRx = waypoints[0].rx;
    let tgtX = curX, tgtY = curY, tgtS = curS, tgtRx = curRx;
    let spinTarget = 0, spinCurrent = 0;

    if (lenis) {
        lenis.on("scroll", (e) => {
            const sp = e.animatedScroll / Math.max(1, document.body.scrollHeight - window.innerHeight);
            spinTarget = sp * Math.PI * 4; // 720° total

            // Find and interpolate between waypoints
            let from = waypoints[0], to = waypoints[waypoints.length - 1];
            for (let i = 0; i < waypoints.length - 1; i++) {
                if (sp >= waypoints[i].t && sp <= waypoints[i + 1].t) {
                    from = waypoints[i]; to = waypoints[i + 1]; break;
                }
            }
            const range = to.t - from.t;
            const rawT  = range > 0 ? (sp - from.t) / range : 0;
            const t     = rawT * rawT * (3 - 2 * rawT); // smoothstep

            tgtX  = from.x  + (to.x  - from.x)  * t;
            tgtY  = from.y  + (to.y  - from.y)  * t;
            tgtS  = from.s  + (to.s  - from.s)  * t;
            tgtRx = from.rx + (to.rx - from.rx) * t;
        });
    }

    // Render loop with lerp
    const lf = 0.04;
    (function animate() {
        requestAnimationFrame(animate);
        curX  += (tgtX  - curX)  * lf;
        curY  += (tgtY  - curY)  * lf;
        curS  += (tgtS  - curS)  * lf;
        curRx += (tgtRx - curRx) * lf;
        spinCurrent += (spinTarget - spinCurrent) * 0.06;

        chakraGroup.position.set(curX, curY, 0);
        chakraGroup.scale.setScalar(curS);
        chakraGroup.rotation.x = curRx;
        chakraGroup.rotation.z = spinCurrent;

        renderer.render(scene, camera);
    })();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
