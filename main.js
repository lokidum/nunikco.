/**
 * Nunik Co. 
 * High-End Kinetic Engine (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // ----------------------------------------------------
    // 1. Smooth Scrolling (Lenis)
    // ----------------------------------------------------
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    // Sync GSAP ScrollTrigger with Lenis
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    // Anchor Link Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            lenis.scrollTo(targetId, {
                offset: -100, // Account for fixed navbar
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        });
    });

    // ----------------------------------------------------
    // 2. Custom Cursor
    // ----------------------------------------------------
    const cursor = document.getElementById("custom-cursor");
    
    // Set initial position
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    // For smooth lerping
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const updateCursor = () => {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        if(cursor) {
            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        }
        requestAnimationFrame(updateCursor);
    };
    updateCursor();

    // Hover logic for elements
    document.querySelectorAll(".nav-link, a, button, .hoverable-glass").forEach(el => {
        el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
    });

    // Specific "View Project" logic for portfolio items
    document.querySelectorAll(".cursor-project").forEach(el => {
        el.addEventListener("mouseenter", () => {
            cursor.classList.remove("hovering");
            cursor.classList.add("view-project");
        });
        el.addEventListener("mouseleave", () => {
            cursor.classList.remove("view-project");
        });
    });

    // ----------------------------------------------------
    // 3. Kinetic Typography (Hero Lanterne Architectes effect)
    // ----------------------------------------------------
    const heroTitle = document.getElementById("hero-title");
    if(heroTitle) {
        // Extract inner HTML structure, ensuring we keep tags or just split inner Text.
        // The user provided multiple spans, we must decompose correctly.
        const originalHTML = heroTitle.innerHTML;
        // Strip out the wrapper spans to split individually for kinetic text
        let wrappedText = '';
        const words = ['N', 'U', 'N', 'I', 'K', ' ', 'C', 'O', '.'];
        
        words.forEach(char => {
            if(char === ' ') {
                wrappedText += `<span class="char inline-block">&nbsp;</span>`;
            } else if(char === 'C' || char === 'O' || char === '.') {
                wrappedText += `<span class="char inline-block text-primary-fixed-dim transition-transform duration-300">${char}</span>`;
            } else {
                wrappedText += `<span class="char inline-block transition-transform duration-300">${char}</span>`;
            }
        });
        
        heroTitle.innerHTML = wrappedText;
        const chars = heroTitle.querySelectorAll(".char");

        // React to mouse
        heroTitle.addEventListener("mousemove", (e) => {
            const rect = heroTitle.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width; // 0 to 1
            const normalizedX = (relX - 0.5) * 2; // -1 to 1

            gsap.to(chars, {
                x: (i) => {
                    // Push characters outwards based on mouse
                    const centerDist = (i / chars.length) - 0.5;
                    return (normalizedX - centerDist) * -30;
                },
                skewX: normalizedX * 20,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        heroTitle.addEventListener("mouseleave", () => {
            gsap.to(chars, {
                x: 0,
                skewX: 0,
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }

    // ----------------------------------------------------
    // 4. GSAP Mask Reveals (ScrollTrigger)
    // ----------------------------------------------------
    const revealContainers = document.querySelectorAll(".reveal-container");
    revealContainers.forEach((container) => {
        const items = container.querySelectorAll(".reveal-item");
        
        // Setup initial state before scroll
        gsap.set(items, { y: 100, opacity: 0 });

        ScrollTrigger.create({
            trigger: container,
            start: "top 85%",
            onEnter: () => {
                gsap.to(items, {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "power4.out"
                });
            },
            once: true // only animate in once
        });
    });

    // ----------------------------------------------------
    // 5. Parallax Imagery
    // ----------------------------------------------------
    const parallaxImages = document.querySelectorAll(".parallax-img");
    parallaxImages.forEach((img) => {
        gsap.to(img, {
            yPercent: 20, // Moves down within its container as user scrolls
            ease: "none",
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // ----------------------------------------------------
    // 6. Initiate Protocol / Contact Reveal
    // ----------------------------------------------------
    const initiateBtn = document.getElementById("initiate-btn");
    const contactExpansion = document.getElementById("contact-expansion");
    
    if (initiateBtn && contactExpansion) {
        initiateBtn.addEventListener("click", () => {
            // Expand the hidden panel using GSAP
            gsap.to(contactExpansion, {
                height: "auto",
                opacity: 1,
                paddingTop: "2rem",
                paddingBottom: "2rem",
                duration: 0.8,
                ease: "power3.inOut",
                onComplete: () => {
                    // Smoothly scroll down to show the new panel
                    lenis.scrollTo("#connect", {
                        duration: 1.2,
                        offset: -50
                    });
                }
            });
            
            // Optionally, fade out the floating button once initiated
            gsap.to(initiateBtn, { opacity: 0, scale: 0.8, duration: 0.4, pointerEvents: "none" });
        });
    }

    // ----------------------------------------------------
    // 7. Three.js Fluid WebGL Background
    // ----------------------------------------------------
    initWebGLBackground(lenis);
});

function initWebGLBackground(lenis) {
    const container = document.getElementById('webgl-background');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Using colors directly matching the user's latest Tailwind Config
    // teal-900 logic (#111417 base, #2c4c4c teal atmospheric, #b35d44 energy)
    const uniforms = {
        uTime: { value: 0.0 },
        uScroll: { value: 0.0 },
        uColorBase: { value: new THREE.Color("#111417") }, 
        uColorAccent1: { value: new THREE.Color("#b35d44") }, 
        uColorAccent2: { value: new THREE.Color("#2c4c4c") }
    };

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
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
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = vUv;
            
            // Kinetic fluid reacting to scroll velocity and time
            float time = uTime * 0.15 + uScroll * 0.005;
            
            vec2 noisePos = uv * 2.0;
            float n1 = snoise(noisePos + vec2(time, time * 0.5));
            float n2 = snoise(noisePos * 2.0 - vec2(time * 0.8, time * 1.2));
            float n3 = snoise(noisePos * 4.0 + vec2(time * 2.0, time));
            
            float combinedNoise = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
            
            // Heavily weighted towards the deep base, accents only shine strictly
            vec3 color = mix(uColorBase, uColorAccent2, combinedNoise * 0.6);
            
            float secondaryNoise = snoise(uv * 3.0 + vec2(-time, time));
            // Rare flashes of the primary accent
            color = mix(color, uColorAccent1, smoothstep(0.7, 1.0, combinedNoise * secondaryNoise));
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let currentScroll = 0;
    if (lenis) {
        lenis.on('scroll', (e) => {
            currentScroll = e.animatedScroll;
        });
    }

    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uScroll.value += (currentScroll - uniforms.uScroll.value) * 0.1;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
