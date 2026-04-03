/** 
 * Nunik Co. - Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize Lenis (Smooth Scrolling)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP ScrollTrigger with Lenis
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time)=>{
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    // 2. GSAP Interactive Title
    const title = document.getElementById("interactive-title");
    if (title) {
        // Split text into characters manually since we don't have SplitText plugin
        const text = title.innerText;
        title.innerHTML = '';
        
        const chars = [];
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.innerText = char;
            span.className = 'char';
            // preserve spaces
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
            }
            title.appendChild(span);
            chars.push(span);
        });

        // Entrance animation
        gsap.fromTo(chars, 
            { y: 100, opacity: 0, rotateX: -90 },
            { 
                y: 0, 
                opacity: 1, 
                rotateX: 0, 
                duration: 1.2, 
                stagger: 0.04, 
                ease: "power4.out",
                delay: 0.2
            }
        );

        // Mouse move effect (Lanterne Architectes style)
        const handleMouseMove = (e) => {
            const xPos = (e.clientX / window.innerWidth) - 0.5;
            
            gsap.to(chars, {
                skewX: xPos * 20,
                // Simulate variable font weight via textShadow or scale if font doesn't support variable axes dynamically
                scaleX: 1 + Math.abs(xPos) * 0.1,
                duration: 0.8,
                ease: "power2.out",
                stagger: { each: 0.02, from: "center" }
            });
        };

        const handleMouseLeave = () => {
            gsap.to(chars, {
                skewX: 0,
                scaleX: 1,
                duration: 1,
                ease: "elastic.out(1, 0.3)",
                stagger: { each: 0.02, from: "center" }
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
    }

    // 3. WebGL Background (Three.js)
    initWebGLBackground(lenis);
});

function initWebGLBackground(lenis) {
    const container = document.getElementById('webgl-background');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Shader uniforms
    const uniforms = {
        uTime: { value: 0.0 },
        uScroll: { value: 0.0 },
        uColorBase: { value: new THREE.Color("#1B1E22") },    // Midnight Obsidian
        uColorAccent1: { value: new THREE.Color("#B35D44") }, // Raw Terracotta
        uColorAccent2: { value: new THREE.Color("#7A9B9B") }  // Oxidized Teal
    };

    // Shaders
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

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
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
            
            // Create fluid-like movement tracking time and scroll velocity
            float time = uTime * 0.15 + uScroll * 0.005;
            
            vec2 noisePos = uv * 2.0;
            float n1 = snoise(noisePos + vec2(time, time * 0.5));
            float n2 = snoise(noisePos * 2.0 - vec2(time * 0.8, time * 1.2));
            float n3 = snoise(noisePos * 4.0 + vec2(time * 2.0, time));
            
            float combinedNoise = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
            
            // Blend colors based on noise
            vec3 color = mix(uColorBase, uColorAccent1, combinedNoise * 0.7);
            
            float secondaryNoise = snoise(uv * 3.0 + vec2(-time, time));
            color = mix(color, uColorAccent2, smoothstep(0.4, 0.9, combinedNoise * secondaryNoise));
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Geometry & Material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Update uScroll uniform efficiently
    let currentScroll = 0;
    if (lenis) {
        lenis.on('scroll', (e) => {
            currentScroll = e.animatedScroll;
        });
    } else {
        window.addEventListener('scroll', () => {
            currentScroll = window.scrollY;
        });
    }

    // Animation Loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        uniforms.uTime.value = clock.getElapsedTime();
        // easing the scroll interaction into the shader for smoother fluid warping
        uniforms.uScroll.value += (currentScroll - uniforms.uScroll.value) * 0.1;
        
        renderer.render(scene, camera);
    }
    
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
