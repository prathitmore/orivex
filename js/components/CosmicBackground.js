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

    const init = () => {
        if (window.THREE) {
            setup();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js';
            script.onload = setup;
            document.head.appendChild(script);
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
        const starCount = 10000;
        const starPos = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;

            const r = 0.8 + Math.random() * 0.2;
            const g = 0.8 + Math.random() * 0.2;
            const b = 0.9 + Math.random() * 0.1;
            starColors[i * 3] = r;
            starColors[i * 3 + 1] = g;
            starColors[i * 3 + 2] = b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 4, // Larger size to show circular glow
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
        const nebulaCount = 50;
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

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        animate();
    };

    const onMouseMove = (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.03;
        targetY += (mouseY - targetY) * 0.03;

        stars.rotation.y += 0.0002;
        stars.rotation.x += 0.0001;

        // Parallax
        stars.position.x = targetX * 50;
        stars.position.y = -targetY * 50;

        nebula.rotation.z += 0.0005;
        nebula.position.x = targetX * 30;
        nebula.position.y = -targetY * 30;

        renderer.render(scene, camera);
    };

    container.cleanup = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
        document.removeEventListener('mousemove', onMouseMove);
        if (renderer) renderer.dispose();
    };

    init();
    return container;
}
