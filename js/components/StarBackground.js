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
        container.appendChild(renderer.domElement);

        starGeo = new THREE.BufferGeometry();
        const starCount = 6000;
        const positions = new Float32Array(starCount * 3);
        const velocities = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = Math.random() * 600 - 300;     // x
            positions[i * 3 + 1] = Math.random() * 600 - 300; // y
            positions[i * 3 + 2] = Math.random() * 600 - 300; // z
            velocities[i] = 0;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        starMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.7,
            transparent: true
        });

        stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);

        window.addEventListener('resize', onWindowResize, false);
        animate();
    };

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);

        const positions = starGeo.attributes.position.array;
        for (let i = 0; i < 6000; i++) {
            // Speed up as they come closer
            let velocity = (positions[i * 3 + 1] + 300) / 600 * 0.5 + 0.1;
            positions[i * 3 + 1] -= velocity;

            if (positions[i * 3 + 1] < -300) {
                positions[i * 3 + 1] = 300;
            }
        }
        starGeo.attributes.position.needsUpdate = true;
        stars.rotation.y += 0.002;

        renderer.render(scene, camera);
    };

    // Cleanup method
    container.cleanup = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);
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
