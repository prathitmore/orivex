/**
 * CosmicBackground.js
 * A premium Three.js background featuring a nebula and interactive starfield.
 */

export function CosmicBackground() {
    const container = document.createElement('div');
    container.id = 'cosmic-background';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '0';
    container.style.background = '#050508'; // Deep space black-blue
    container.style.pointerEvents = 'none';

    let renderer, scene, camera, stars, nebula;
    let animationId;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let isDestroyed = false;

    const init = () => {
        if (window.THREE) {
            setup();
        } else {
            // Fallback for extreme edge cases: listen for load on existing script or add it
            const existingScript = document.querySelector('script[src*="three.min.js"]');
            if (existingScript) {
                existingScript.addEventListener('load', setup);
            } else {
                // If not found in DOM, log error (should be in index.html now)
                console.error("Three.js not found. Ensure it is included in index.html");
            }
        }
    };

    const createCloudTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.2, 'rgba(100, 150, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(50, 0, 100, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    };

    const createStarTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    };

    const setup = () => {
        if (isDestroyed) return;

        const THREE = window.THREE;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 100;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // 1. Starfield
        const starGeo = new THREE.BufferGeometry();
        const starCount = 50000; // Signficantly increased density
        const starPos = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;

            const r = 0.82 + Math.random() * 0.18;
            const g = 0.82 + Math.random() * 0.18;
            const b = 0.9 + Math.random() * 0.1;
            starColors[i * 3] = r;
            starColors[i * 3 + 1] = g;
            starColors[i * 3 + 2] = b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 3.5, // Slightly smaller to allow for more density without overlapping too much
            map: createStarTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            alphaTest: 0.1, // Clipping
            blending: THREE.AdditiveBlending
        });

        stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);

        // 2. Nebula (Simplified Cloud Sprite System)
        const cloudTexture = createCloudTexture();
        const nebulaCount = 100; // Richer nebula clouds
        const nebulaGroup = new THREE.Group();

        for (let i = 0; i < nebulaCount; i++) {
            const material = new THREE.SpriteMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.1 + Math.random() * 0.2,
                blending: THREE.AdditiveBlending,
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.6, 0.5, 0.5) // Purple/Blue range
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 400 - 200
            );
            sprite.scale.set(300, 300, 1);
            nebulaGroup.add(sprite);
        }
        nebula = nebulaGroup;
        scene.add(nebula);

        // 3. Andromeda Galaxy (Photo Spirit System)
        const loader = new THREE.TextureLoader();
        loader.load('assets/andromeda.jpg', (texture) => {
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0, // Fade in
                blending: THREE.AdditiveBlending,
                color: 0xffffff
            });

            const galaxySprite = new THREE.Sprite(material);
            // Position it centrally but deep
            galaxySprite.position.set(0, 0, -800);
            galaxySprite.scale.set(1200, 1000, 1); // Large presence
            scene.add(galaxySprite);

            // Track for animation
            container.andromeda = galaxySprite;

            // Smooth fade in
            let reveal = 0;
            const fadeIn = () => {
                if (reveal < 0.7) {
                    reveal += 0.01;
                    material.opacity = reveal;
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
        }, undefined, (err) => {
            console.error("Failed to load galaxy texture:", err);
        });

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchstart', onTouchMove, { passive: false });


        // Force a resize/render shortly after setup to ensure correct dimensions
        setTimeout(() => {
            if (!isDestroyed) onWindowResize();
        }, 100);

        animate();
    };

    const onMouseMove = (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    const onTouchMove = (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            mouseX = (touch.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            mouseY = (touch.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        }
    };

    const onWindowResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
        if (isDestroyed) return;
        animationId = requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.03;
        targetY += (mouseY - targetY) * 0.03;

        if (stars) {
            stars.rotation.y += 0.0002;
            stars.rotation.x += 0.0001;

            // Parallax
            stars.position.x = targetX * 50;
            stars.position.y = -targetY * 50;
        }

        if (nebula) {
            nebula.rotation.z += 0.0005;
            nebula.position.x = targetX * 30;
            nebula.position.y = -targetY * 30;
        }

        if (container.andromeda) {
            // Sync with stars parallax (50 offset)
            container.andromeda.position.x = 0 + targetX * 50;
            container.andromeda.position.y = 0 - targetY * 50;
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    };

    container.cleanup = () => {
        isDestroyed = true;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchstart', onTouchMove);
        if (renderer) {
            renderer.dispose();
            // Also dispose geometries/materials ideally
        }
    };

    init();
    return container;
}
