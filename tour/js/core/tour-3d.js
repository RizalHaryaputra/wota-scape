/**
 * tour-3d.js — WotaScape Virtual Tour
 * ============================================================
 * Mengatur inisialisasi Three.js, OrbitControls, Panorama, 
 * Hotspots, dan Raycaster.
 * ============================================================
 */

import { showMedia } from '../ui/ui-controller.js';

/* ===== STATE VARIABLES ===== */
let scene, camera, renderer, controls;
let spriteHotspots = [];
let panoramaMesh;
export let targetFov = 70;
let initialFov = 70;
let initialPinchDistance = null;

const overlayEl = document.getElementById('overlay');
const containerEl = document.getElementById('container');
// eslint-disable-next-line no-undef
const raycaster = new THREE.Raycaster();
// eslint-disable-next-line no-undef
const mouse = new THREE.Vector2();

/* ===== PANORAMA STATE ===== */
let currentPanorama = '1.jpg';
let previousPanorama = null;

/* ===== EXPORT UI CONTROLLERS ===== */
export const getControls = () => controls;
export const getTargetFov = () => targetFov;
export const setTargetFov = (val) => { targetFov = val; };

/* Jalankan saat halaman siap */
init();
animate();

/* ========================================
 * FUNCTION: init
 * Inisialisasi scene Three.js, kamera,
 * renderer, orbit controls, dan panorama awal.
 * ======================================== */
function init() {
    // eslint-disable-next-line no-undef
    scene = new THREE.Scene();
    // eslint-disable-next-line no-undef
    camera = new THREE.PerspectiveCamera(20, containerEl.clientWidth / containerEl.clientHeight, 0.1, 1000);
    camera.position.set(0.1, -0.035, 0);

    // eslint-disable-next-line no-undef
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    containerEl.appendChild(renderer.domElement);

    // eslint-disable-next-line no-undef
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 5;
    controls.enablePan = false;
    controls.rotateSpeed = -0.3;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = false;

    /* Sphere geometry untuk panorama (scale -1 agar dalam-keluar) */
    // eslint-disable-next-line no-undef
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    /* Load panorama pertama */
    // eslint-disable-next-line no-undef
    new THREE.TextureLoader().load(
        'panoramas/1.jpg',
        function onLoad(texture) {
            // eslint-disable-next-line no-undef
            const material = new THREE.MeshBasicMaterial({ map: texture });
            // eslint-disable-next-line no-undef
            panoramaMesh = new THREE.Mesh(geometry, material);
            scene.add(panoramaMesh);
            loadHotspotsFor('1.jpg');

            /* Tahan loading screen 2 detik untuk UX yang mulus */
            setTimeout(() => {
                const loaderScreen = document.getElementById('global-loader');
                if (loaderScreen) {
                    loaderScreen.style.opacity = '0';
                    setTimeout(() => { loaderScreen.style.display = 'none'; }, 500);
                }
            }, 2000);
        },
        function onProgress(xhr) {
            console.log(`Panorama: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
        },
        function onError(err) {
            console.error('Gagal memuat panorama:', err);
        }
    );

    /* Event listeners */
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);

    /* ===== DRAG vs. CLICK DETECTION ===== */
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    document.addEventListener('pointerdown', (e) => {
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
    });

    document.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
            isDragging = true;
        }
    });

    document.addEventListener('pointerup', (e) => {
        /* Abaikan klik di atas elemen UI */
        if (e.target.closest('.navbar') ||
            e.target.closest('aside') ||
            e.target.closest('.modal') ||
            e.target.closest('.modal-backdrop')) return;

        /* Abaikan jika sedang drag (geser panorama) */
        if (isDragging) return;

        /* === Mode Developer: Position Picker === */
        if (pickerMode) {
            // eslint-disable-next-line no-undef
            const mousePos = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            // eslint-disable-next-line no-undef
            const pickerRay = new THREE.Raycaster();
            pickerRay.setFromCamera(mousePos, camera);
            const hits = pickerRay.intersectObject(panoramaMesh);
            if (hits.length > 0) {
                const pt = hits[0].point;
                placePickerMarker(pt);
                // eslint-disable-next-line no-undef
                console.log('%c📍 KOORDINAT:', 'color:#00ff00;',
                    `new THREE.Vector3(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})`);
            }
            return;
        }

        /* === Hotspot Click Detection === */
        // eslint-disable-next-line no-undef
        const clickMouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        // eslint-disable-next-line no-undef
        const clickRay = new THREE.Raycaster();
        clickRay.setFromCamera(clickMouse, camera);
        const intersects = clickRay.intersectObjects(spriteHotspots);

        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            if (clicked.userData.onClick) clicked.userData.onClick();
        }
    });
}

/* ========================================
 * FUNCTION: onMouseWheel
 * Scroll mouse untuk adjust zoom FOV.
 * ======================================== */
function onMouseWheel(e) {
    e.preventDefault();
    targetFov += e.deltaY * 0.05;
    // eslint-disable-next-line no-undef
    targetFov = THREE.MathUtils.clamp(targetFov, 30, 100);
}

/* ========================================
 * FUNCTION: loadHotspotsFor
 * Clear semua hotspot lama dan load baru
 * sesuai panorama yang aktif.
 * ======================================== */
function loadHotspotsFor(panorama) {
    clearHotspots();

    /*panoramas*/

    if (panorama === '1.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-395.1211475957762, -58.30213318829353, -6.678901876416617), () => {
            switchPanorama('2.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-460.08, -72.49, -179.48);
        addHotspot('images/image.png', posMedia, () => {
            showMedia(6, { image: 'images/selamat-datang.png', audio: 'audio/selamat-datang.wav' });
        });
        addTextLabel('Selamat Datang', posMedia);
    }

    if (panorama === '2.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(394.5380744600368, -62.277819101636496, -9.101288274622458), () => {
            switchPanorama('1.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-397.5892730140249, -33.489342909172414, -14.93381336018405), () => {
            switchPanorama('4.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-463.95, -43.89, 178.85);
        addHotspot('images/image.png', posMedia, () => {
            showMedia(6, { image: 'images/tentang-krebet.png', audio: 'audio/tentang-krebet.wav' });
        });
        addTextLabel('Tentang Krebet', posMedia);
    }

    if (panorama === '3.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(395.8346232878345, -53.4697473632319, -3.95549334440982), () => {
            switchPanorama('4.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-392.6863823097462, -51.77601937286917, -49.85805093466901), () => {
            switchPanorama('5.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-484.55, -67.73, 101.14);
        addHotspot('images/image.png', posMedia, () => {
            showMedia(6, { image: 'images/lokasi-krebet.png', audio: 'audio/lokasi-krebet.wav' });
        });
        addTextLabel('Lokasi Krebet', posMedia);
    }

    if (panorama === '4.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(396.5404938553538, -47.441896669903784, -3.8605045767290793), () => {
            switchPanorama('2.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-395.79459154752885, -49.895887862517846, -11.40842825630297), () => {
            switchPanorama('3.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-469.31, -57.45, -160.39);
        addHotspot('images/image.png', posMedia, () => {
            showMedia(6, { image: 'images/sejarah-krebet.png', audio: 'audio/sejarah-krebet.wav' });
        });
        addTextLabel('Sejarah Krebet', posMedia);
    }

    if (panorama === '5.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(61.66867499833077, -61.80551619818436, 389.6327924916461), () => {
            switchPanorama('3.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-482.94, -33.24, -121.80), () => {
            switchPanorama('6.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-117.98691115406146, -45.230478016162486, -378.82184027339326), () => {
            switchPanorama('36.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-425.43, -57.54, -254.88);
        addHotspot('images/video.png', posMedia, () => {
            showMedia(5, 'https://www.youtube.com/embed/mKU3PBr2ARE?si=mv-XKY0gWJtFW6xL');
        });
        addTextLabel('Video Profil', posMedia);
    }

    if (panorama === '6.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(497.82, -22.76, -24.60), () => {
            switchPanorama('5.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-497.01, -42.90, -19.33), () => {
            switchPanorama('33.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(-476.38, -64.36, 133.92);
        addHotspot('images/video.png', posMedia, () => {
            showMedia(2, 'videos/mars.mp4');
        });
        addTextLabel('Mars Krebet', posMedia);
    }

    if (panorama === '33.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-398.65305232127207, -25.871103854557305, -4.4590244374591546), () => {
            switchPanorama('6.jpg');
        });
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(398.77267040194437, -18.132482280878172, -6.939524042517586), () => {
            switchPanorama('34.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(481.85, -70.59, -110.63);
        addHotspot('images/video.png', posMedia, () => {
            showMedia(5, 'https://www.youtube.com/embed/Z8nDD9Lg5ug?si=p0G2hSgKVKdCEszq');
        });
        addTextLabel('Kesenian (1)', posMedia);

        if (previousPanorama === '6.jpg') {
            camera.lookAt(398.77267040194437, -18.132482280878172, -6.939524042517586);
            controls.target.set(398.77267040194437, -18.132482280878172, -6.939524042517586).normalize();
            controls.update();
        }
    }

    if (panorama === '34.jpg') {
        // eslint-disable-next-line no-undef
        addHotspot('images/chevrontilted.png', new THREE.Vector3(-398.3457598626258, -29.817333000518882, -7.411376568996783), () => {
            switchPanorama('33.jpg');
        });

        // eslint-disable-next-line no-undef
        let posMedia = new THREE.Vector3(460.54, -56.71, -183.50);
        addHotspot('images/video.png', posMedia, () => {
            showMedia(5, 'https://www.youtube.com/embed/ULH1EmgYwUU?si=a8FNDl5u3V9YhiFT');
        });
        addTextLabel('Kesenian (2)', posMedia);
    }

    /*panoramas-end*/
}

/* ========================================
 * FUNCTION: switchPanorama
 * Ganti panorama dengan animasi fade.
 * ======================================== */
function switchPanorama(panoramaName) {
    if (currentPanorama === panoramaName) return;

    previousPanorama = currentPanorama;

    // Tampilkan overlay dengan tampilan menarik
    overlayEl.style.pointerEvents = 'auto';
    overlayEl.style.opacity = '1';
    
    // Animasi zoom out sebelum transisi
    targetFov = 90;

    const startTime = Date.now();

    // Mulai load texture baru SEMBARI tetap menampilkan texture lama di bawah overlay
    // eslint-disable-next-line no-undef
    new THREE.TextureLoader().load(`panoramas/${panoramaName}`, (tex) => {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 800 - elapsed); // pastikan minimal overlay tampil 800ms untuk efek yang mulus

        setTimeout(() => {
            // Setelah texture baru siap & timeout tercapai, ganti texture
            if (panoramaMesh.material.map) {
                panoramaMesh.material.map.dispose();
            }
            panoramaMesh.material.map = tex;
            panoramaMesh.material.needsUpdate = true;

            currentPanorama = panoramaName;
            loadHotspotsFor(currentPanorama);

            // Kembalikan FOV ke normal
            targetFov = 70;

            // Sembunyikan overlay
            overlayEl.style.opacity = '0';
            overlayEl.style.pointerEvents = 'none';
        }, remainingDelay);
    });
}

/* ========================================
 * FUNCTION: addHotspot
 * Tambahkan sprite hotspot ke scene.
 * ======================================== */
function addHotspot(imageUrl, position, onClickCallback) {
    // eslint-disable-next-line no-undef
    new THREE.TextureLoader().load(imageUrl, (texture) => {
        // eslint-disable-next-line no-undef
        const material = new THREE.SpriteMaterial({
            map: texture,
            depthTest: false,
            depthWrite: false
        });

        // eslint-disable-next-line no-undef
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(40, 40, 1);
        sprite.renderOrder = 1000;
        sprite.userData = {
            onClick: onClickCallback,
            targetScale: 40,
            initialY: position.y
        };

        spriteHotspots.push(sprite);
        scene.add(sprite);
    });
}

/* ========================================
 * FUNCTION: addTextLabel
 * Tambahkan label teks floating di atas hotspot.
 * ======================================== */
function addTextLabel(text, position) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 256;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const [x, y, w, h, r] = [100, 20, 824, 216, 50];
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // eslint-disable-next-line no-undef
    const texture = new THREE.CanvasTexture(canvas);
    // eslint-disable-next-line no-undef
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    // eslint-disable-next-line no-undef
    const sprite = new THREE.Sprite(material);

    sprite.position.copy(position);
    sprite.position.y += 30;
    sprite.scale.set(80, 20, 1);
    sprite.renderOrder = 9999;
    sprite.userData = { isText: true, initialY: sprite.position.y };

    scene.add(sprite);
    spriteHotspots.push(sprite);
}

/* ========================================
 * FUNCTION: clearHotspots
 * Hapus semua sprite hotspot dari scene.
 * ======================================== */
function clearHotspots() {
    spriteHotspots.forEach(sprite => scene.remove(sprite));
    spriteHotspots = [];
}

/* ========================================
 * FUNCTION: onPointerMove
 * Deteksi hover hotspot untuk efek scale.
 * ======================================== */
function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(spriteHotspots);
    spriteHotspots.forEach(s => { s.userData.targetScale = 40; });
    if (intersects.length > 0) intersects[0].object.userData.targetScale = 50;
}

/* ========================================
 * FUNCTION: onWindowResize
 * Update kamera & renderer saat resize.
 * ======================================== */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ===== DEVELOPER TOOL: Position Picker ===== */
let pickerMode = false;
let pickerSprite = null;

export function togglePicker() {
    pickerMode = !pickerMode;
    if (pickerMode) {
        console.log('%cPosition Picker ENABLED', 'color:#00ff00; font-size:16px;');
    } else {
        console.log('%cPosition Picker DISABLED', 'color:red; font-size:16px;');
        if (pickerSprite) { scene.remove(pickerSprite); pickerSprite = null; }
    }
}

function placePickerMarker(position) {
    // eslint-disable-next-line no-undef
    const texture = new THREE.TextureLoader().load('images/default.png');
    // eslint-disable-next-line no-undef
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
    // eslint-disable-next-line no-undef
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(40, 40, 1);
    sprite.renderOrder = 10000;
    if (pickerSprite) scene.remove(pickerSprite);
    pickerSprite = sprite;
    scene.add(sprite);
}

/* ========================================
 * FUNCTION: animate
 * Game loop — FOV animasi, hotspot bounce.
 * ======================================== */
function animate() {
    requestAnimationFrame(animate);

    /* Smooth FOV interpolation */
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();

    const time = performance.now() * 0.005;

    spriteHotspots.forEach(sprite => {
        if (sprite.userData.isText) {
            if (sprite.userData.initialY !== undefined) {
                sprite.position.y = sprite.userData.initialY + Math.sin(time) * 2;
            }
        } else {
            const currentScale = sprite.scale.x;
            const targetScale = sprite.userData.targetScale || 40;
            // eslint-disable-next-line no-undef
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
            sprite.scale.set(newScale, newScale, 1);

            if (sprite.userData.initialY !== undefined) {
                sprite.position.y = sprite.userData.initialY + Math.sin(time + sprite.id) * 2;
            }
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

/*customjs*/
/*customjs-end*/
