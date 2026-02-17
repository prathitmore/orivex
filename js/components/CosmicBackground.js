export function CosmicBackground() {
    // Singleton Check: If it already exists, just return it
    let container = document.getElementById('cosmic-background');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'cosmic-background';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '0';
    container.style.background = '#020205';
    container.style.pointerEvents = 'none';

    let renderer, scene, camera, stars, nebula;
    let animationId;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let isDestroyed = false;

    const setup = () => {
        if (isDestroyed) return;

        const THREE = window.THREE;
        if (!THREE) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.z = 1200;

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.error("WebGL Initialization failed:", e);
            container.style.background = "linear-gradient(to bottom, #020205, #0a0a1a)";
            return;
        }

        // 1. Starfield
        const starGeo = new THREE.BufferGeometry();
        const starCount = 50000;
        const starPos = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;

            starColors[i * 3] = 0.82 + Math.random() * 0.18;
            starColors[i * 3 + 1] = 0.82 + Math.random() * 0.18;
            starColors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 3.5,
            map: createStarTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            alphaTest: 0.1,
            blending: THREE.AdditiveBlending
        });

        stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);

        // 2. Nebula
        const cloudTexture = createCloudTexture();
        const nebulaCount = 100;
        const nebulaGroup = new THREE.Group();

        for (let i = 0; i < nebulaCount; i++) {
            const material = new THREE.SpriteMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.1 + Math.random() * 0.2,
                blending: THREE.AdditiveBlending,
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.6, 0.5, 0.5)
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, (Math.random() - 0.5) * 400 - 200);
            sprite.scale.set(300, 300, 1);
            nebulaGroup.add(sprite);
        }
        nebula = nebulaGroup;
        scene.add(nebula);

        // 3. Andromeda Galaxy
        const loader = new THREE.TextureLoader();
        loader.load('assets/andromeda.jpg', (texture) => {
            const img = texture.image;
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                data[i + 3] = Math.max(0, Math.pow(brightness / 255, 2.2) * 1.1 - 0.1) * 255;
            }
            ctx.putImageData(imgData, 0, 0);

            const processedTexture = new THREE.CanvasTexture(canvas);
            processedTexture.anisotropy = 16;
            processedTexture.minFilter = THREE.LinearFilter;
            processedTexture.magFilter = THREE.LinearFilter;

            const material = new THREE.SpriteMaterial({
                map: processedTexture,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                color: 0xffffff
            });

            const galaxySprite = new THREE.Sprite(material);
            const imgAspect = img.width / img.height;
            const targetWidth = 3000;
            galaxySprite.scale.set(targetWidth, targetWidth / imgAspect, 1);
            galaxySprite.position.set(0, 0, -200);
            scene.add(galaxySprite);

            container.andromeda = galaxySprite;

            let reveal = 0;
            const fadeIn = () => {
                if (reveal < 1.0) {
                    reveal += 0.05;
                    material.opacity = reveal;
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
        });

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchstart', onTouchMove, { passive: false });

        animate();
    };

    const animate = () => {
        if (isDestroyed) return;
        animationId = requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.03;
        targetY += (mouseY - targetY) * 0.03;

        if (stars) {
            stars.rotation.y += 0.0002;
            stars.rotation.x += 0.0001;
            stars.position.x = targetX * 25;
            stars.position.y = -targetY * 25;
        }
        if (nebula) {
            nebula.rotation.z += 0.0005;
            nebula.position.x = targetX * 30;
            nebula.position.y = -targetY * 30;
        }
        if (container.andromeda) {
            container.andromeda.rotation.z += 0.0001;
            container.andromeda.position.x = targetX * 25;
            container.andromeda.position.y = -targetY * 25;
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    };

    const onWindowResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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

    const createCloudTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
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
        canvas.width = 64; canvas.height = 64;
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

    // Initialize only if THREE is available
    if (window.THREE) {
        setup();
    } else {
        const checkThree = setInterval(() => {
            if (window.THREE) {
                setup();
                clearInterval(checkThree);
            }
        }, 100);
    }

    return container;
}
