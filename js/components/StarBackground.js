/**
 * StarBackground.js
 * Creates a dynamic Three.js starfield background.
 */

export function StarBackground() {
    const container = document.createElement('div');
    container.id = 'star-background';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.background = 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)';

    let renderer, scene, camera, stars, starGeo, starMaterial;
    let animationId;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    // Load Three.js dynamically if not already present
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

    const setup = () => {
        const THREE = window.THREE;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 1;
        camera.rotation.x = Math.PI / 2;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        starGeo = new THREE.BufferGeometry();
        const starCount = 8000; // More stars for better immersion
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = Math.random() * 800 - 400;     // x
            positions[i * 3 + 1] = Math.random() * 1000 - 500; // y (longer depth)
            positions[i * 3 + 2] = Math.random() * 800 - 400; // z
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0.8
        });

        stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('mousemove', onMouseMove, false);
        animate();
    };

    const onMouseMove = (event) => {
        // Normalize mouse coordinates (-1 to +1)
        mouseX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Smootly interpolate target position (lerp)
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        // Apply parallax to the whole star system
        stars.rotation.z = targetX * 0.1;
        stars.rotation.y = targetX * 0.05;
        stars.position.x = targetX * 20;
        stars.position.z = targetY * 10;

        const positions = starGeo.attributes.position.array;
        for (let i = 0; i < 8000; i++) {
            // Forward movement
            let velocity = (positions[i * 3 + 1] + 500) / 1000 * 0.6 + 0.2;
            positions[i * 3 + 1] -= velocity;

            if (positions[i * 3 + 1] < -500) {
                positions[i * 3 + 1] = 500;
                positions[i * 3] = Math.random() * 800 - 400;
                positions[i * 3 + 2] = Math.random() * 800 - 400;
            }
        }
        starGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    };

    // Cleanup method
    container.cleanup = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
        document.removeEventListener('mousemove', onMouseMove);
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        }
        if (starGeo) starGeo.dispose();
        if (starMaterial) starMaterial.dispose();
    };

    init();

    return container;
}
