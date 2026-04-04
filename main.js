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
    dark:  { base: "#111417", accent1: "#b35d44", accent2: "#2c4c4c" },
    // Light mode: warm amber second accent makes the fluid feel rich, not washed out
    light: { base: "#F8F6F3", accent1: "#B35D44", accent2: "#C4875A" }
};

/* ================================================
   Theme utilities
   ================================================ */
function isDark() {
    return document.documentElement.classList.contains("dark");
}

function applyThemeIcons() {
    const icon = isDark() ? "light_mode" : "dark_mode";
    document.querySelectorAll(".theme-icon, .theme-icon-mobile").forEach(el => {
        el.textContent = icon;
    });
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
}

/* ================================================
   Main Init
   ================================================ */
document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);
    applyThemeIcons();

    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("theme-toggle-mobile")?.addEventListener("click", toggleTheme);

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

    // ── Hero 3D kinetic typography ────────────────────
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle && !isTouch) {
        const letters = ["N", "U", "N", "I", "K", " ", "C", "O", "."];
        let html = "";
        letters.forEach(ch => {
            if (ch === " ") {
                html += '<span class="char inline-block">&nbsp;</span>';
            } else if ("CO.".includes(ch)) {
                html += `<span class="char inline-block t-accent-lt" style="display:inline-block;transform-style:preserve-3d;">${ch}</span>`;
            } else {
                html += `<span class="char inline-block" style="display:inline-block;transform-style:preserve-3d;">${ch}</span>`;
            }
        });
        heroTitle.innerHTML = html;
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
    // Using Web3Forms (web3forms.com — free, no backend needed).
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
                    formData.append("subject", `New Inquiry from ${formData.get("name") || "Website"} — nunik.co`);
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
                window.location.href = `mailto:hello@nunik.co?subject=${encodeURIComponent(`New Inquiry — ${d.service || "nunik.co"}`)}&body=${encodeURIComponent(body)}`;
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
   3D Sudarshana Chakra — scroll-driven traversal
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
