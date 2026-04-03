/**
 * Nunik Co.
 * High-End Kinetic Engine (Vanilla JS)
 */

/* ================================================
   WebGL uniform reference (shared across scopes)
   ================================================ */
let webglUniforms = null;

/* ================================================
   Theme palettes for WebGL
   ================================================ */
const THEME_COLORS = {
    dark:  { base: "#111417", accent1: "#b35d44", accent2: "#2c4c4c" },
    light: { base: "#F8F6F3", accent1: "#B35D44", accent2: "#C8D8D8" }
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
        br: new THREE.Color(palette.base).r, bg: new THREE.Color(palette.base).g, bb: new THREE.Color(palette.base).b,
        a1r: new THREE.Color(palette.accent1).r, a1g: new THREE.Color(palette.accent1).g, a1b: new THREE.Color(palette.accent1).b,
        a2r: new THREE.Color(palette.accent2).r, a2g: new THREE.Color(palette.accent2).g, a2b: new THREE.Color(palette.accent2).b
    };

    if (animate && typeof gsap !== "undefined") {
        const current = {
            br: webglUniforms.uColorBase.value.r, bg: webglUniforms.uColorBase.value.g, bb: webglUniforms.uColorBase.value.b,
            a1r: webglUniforms.uColorAccent1.value.r, a1g: webglUniforms.uColorAccent1.value.g, a1b: webglUniforms.uColorAccent1.value.b,
            a2r: webglUniforms.uColorAccent2.value.r, a2g: webglUniforms.uColorAccent2.value.g, a2b: webglUniforms.uColorAccent2.value.b
        };
        gsap.to(current, {
            ...target,
            duration: 1.2,
            ease: "power2.inOut",
            onUpdate: () => {
                webglUniforms.uColorBase.value.setRGB(current.br, current.bg, current.bb);
                webglUniforms.uColorAccent1.value.setRGB(current.a1r, current.a1g, current.a1b);
                webglUniforms.uColorAccent2.value.setRGB(current.a2r, current.a2g, current.a2b);
            }
        });
    } else {
        webglUniforms.uColorBase.value.set(palette.base);
        webglUniforms.uColorAccent1.value.set(palette.accent1);
        webglUniforms.uColorAccent2.value.set(palette.accent2);
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
}

/* ================================================
   Main Init
   ================================================ */
document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);

    applyThemeIcons();

    // Theme toggle buttons
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("theme-toggle-mobile")?.addEventListener("click", toggleTheme);

    // ------------------------------------------------
    // 1. Smooth Scrolling (Lenis)
    // ------------------------------------------------
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
        console.warn("Lenis failed to load, falling back to native scroll.", e);
    }

    // Anchor smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const id = this.getAttribute("href");
            if (id === "#") {
                if (lenis) lenis.scrollTo(0, { duration: 1.5 });
                else window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const target = document.querySelector(id);
            if (!target) return;
            if (lenis) {
                lenis.scrollTo(target, {
                    offset: -100,
                    duration: 1.5,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            } else {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // ------------------------------------------------
    // 2. Custom Cursor
    // ------------------------------------------------
    const cursor = document.getElementById("custom-cursor");
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let cursorX = mouseX, cursorY = mouseY;

    window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    (function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        if (cursor) cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(updateCursor);
    })();

    document.querySelectorAll(".nav-link, a, button, .hoverable-glass").forEach(el => {
        el.addEventListener("mouseenter", () => cursor?.classList.add("hovering"));
        el.addEventListener("mouseleave", () => cursor?.classList.remove("hovering"));
    });

    document.querySelectorAll(".cursor-project").forEach(el => {
        el.addEventListener("mouseenter", () => { cursor?.classList.remove("hovering"); cursor?.classList.add("view-project"); });
        el.addEventListener("mouseleave", () => { cursor?.classList.remove("view-project"); });
    });

    // ------------------------------------------------
    // 3. Kinetic Typography (Hero)
    // ------------------------------------------------
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
        const letters = ["N", "U", "N", "I", "K", " ", "C", "O", "."];
        let html = "";
        letters.forEach(ch => {
            if (ch === " ") {
                html += '<span class="char inline-block">&nbsp;</span>';
            } else if ("CO.".includes(ch)) {
                html += `<span class="char inline-block t-accent-lt" style="transition:transform 0.3s;">${ch}</span>`;
            } else {
                html += `<span class="char inline-block" style="transition:transform 0.3s;">${ch}</span>`;
            }
        });
        heroTitle.innerHTML = html;
        const chars = heroTitle.querySelectorAll(".char");

        heroTitle.addEventListener("mousemove", (e) => {
            const rect = heroTitle.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            gsap.to(chars, {
                x: (i) => (nx - (i / chars.length - 0.5)) * -50,
                y: ny * 8,
                skewX: nx * 12,
                duration: 0.6,
                ease: "power2.out"
            });
        });
        heroTitle.addEventListener("mouseleave", () => {
            gsap.to(chars, { x: 0, y: 0, skewX: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" });
        });
    }

    // ------------------------------------------------
    // 4. GSAP ScrollTrigger Reveals
    // ------------------------------------------------
    document.querySelectorAll(".reveal-container").forEach(container => {
        const items = container.querySelectorAll(".reveal-item");
        gsap.set(items, { y: 80, opacity: 0 });
        ScrollTrigger.create({
            trigger: container,
            start: "top 85%",
            onEnter: () => {
                gsap.to(items, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" });
            },
            once: true
        });
    });

    // ------------------------------------------------
    // 5. Parallax Imagery
    // ------------------------------------------------
    document.querySelectorAll(".parallax-img").forEach(img => {
        gsap.to(img, {
            yPercent: 20,
            ease: "none",
            scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
        });
    });

    // ------------------------------------------------
    // 6. Initiate Protocol / Contact Reveal
    // ------------------------------------------------
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

    function getThemeColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
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
        const muted = getThemeColor("--text-muted");
        const green = getThemeColor("--terminal-green");

        await typeTerminalLine("> Initiating transformation protocol...", accent, terminalBoot);
        await new Promise(r => setTimeout(r, 400));
        await typeTerminalLine("> Loading secure data link...", muted, terminalBoot);
        await new Promise(r => setTimeout(r, 300));
        await typeTerminalLine("> Preparing interface...", muted, terminalBoot);
        await new Promise(r => setTimeout(r, 500));

        for (const c of ["3", "2", "1"]) {
            const el = document.createElement("p");
            el.style.cssText = `color:${accent}; font-size:1.5rem; font-weight:700;`;
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

        if (lenis) lenis.scrollTo(contactExpansion, { duration: 1.2, offset: -120, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    }

    if (initiateBtn && contactExpansion) {
        initiateBtn.addEventListener("click", () => {
            if (protocolInitiated) return;
            protocolInitiated = true;
            gsap.to(initiateBtn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => { initiateBtn.style.pointerEvents = "none"; } });

            const connectSection = document.getElementById("connect");
            if (lenis) {
                lenis.scrollTo(connectSection || contactExpansion, { duration: 1.5, offset: -100, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            }
            setTimeout(expandAndBoot, 1600);
        });
    }

    document.querySelectorAll('a[href="#connect"]').forEach(link => {
        link.addEventListener("click", () => {
            if (protocolInitiated) return;
            setTimeout(() => {
                if (!protocolInitiated) {
                    protocolInitiated = true;
                    gsap.to(initiateBtn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => { if (initiateBtn) initiateBtn.style.pointerEvents = "none"; } });
                    expandAndBoot();
                }
            }, 1600);
        });
    });

    // ------------------------------------------------
    // 7. WebGL Fluid Background
    // ------------------------------------------------
    initWebGLBackground(lenis);
});

/* ================================================
   Three.js WebGL Background
   ================================================ */
function initWebGLBackground(lenis) {
    const container = document.getElementById("webgl-background");
    if (!container || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const palette = isDark() ? THEME_COLORS.dark : THEME_COLORS.light;

    const uniforms = {
        uTime: { value: 0.0 },
        uScroll: { value: 0.0 },
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
        uniform vec3 uColorBase;
        uniform vec3 uColorAccent1;
        uniform vec3 uColorAccent2;
        uniform float uScroll;
        varying vec2 vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x_) - 0.5;
            vec3 ox = floor(x_ + 0.5);
            vec3 a0 = x_ - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = vUv;
            float time = uTime * 0.15 + uScroll * 0.005;
            vec2 np = uv * 2.0;
            float n1 = snoise(np + vec2(time, time * 0.5));
            float n2 = snoise(np * 2.0 - vec2(time * 0.8, time * 1.2));
            float n3 = snoise(np * 4.0 + vec2(time * 2.0, time));
            float cn = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
            vec3 color = mix(uColorBase, uColorAccent2, cn * 0.6);
            float sn = snoise(uv * 3.0 + vec2(-time, time));
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
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uScroll.value += (currentScroll - uniforms.uScroll.value) * 0.1;
        renderer.render(scene, camera);
    })();

    window.addEventListener("resize", () => { renderer.setSize(window.innerWidth, window.innerHeight); });
}
