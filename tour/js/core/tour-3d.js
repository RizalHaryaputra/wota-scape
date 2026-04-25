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
let htmlHotspots = []; // { el: HTMLElement, pos3D: THREE.Vector3 }
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
        /* Abaikan klik di atas elemen UI atau hotspot HTML */
        if (e.target.closest('.navbar') ||
            e.target.closest('aside') ||
            e.target.closest('.modal') ||
            e.target.closest('.modal-backdrop') ||
            e.target.closest('.hs')) return;

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
        addHtmlHotspot('navigate', new THREE.Vector3(-492.71, -83.67, 0.93), null, () => {
            switchPanorama('2.jpg');
        });

        // eslint-disable-next-line no-undef
        addHtmlHotspot('info', new THREE.Vector3(-460.08, -72.49, -179.48), 'Selamat Datang', () => {
            showMedia(6, { image: 'images/selamat-datang.png', audio: 'audio/selamat-datang.wav' });
        });
    }

    if (panorama === '2.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(493.90, -64.03, 30.94), null, () => {
            switchPanorama('1.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-494.63, -62.97, 19.42), null, () => {
            switchPanorama('3.jpg');
        });
    }

    if (panorama === '3.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(395.8346232878345, -53.4697473632319, -3.95549334440982), null, () => {
            switchPanorama('2.jpg');
        });
    }

    if (panorama === '4.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(396.5404938553538, -47.441896669903784, -3.8605045767290793), null, () => {
            switchPanorama('2.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-395.79459154752885, -49.895887862517846, -11.40842825630297), null, () => {
            switchPanorama('3.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('info', new THREE.Vector3(-469.31, -57.45, -160.39), 'Sejarah Krebet', () => {
            showMedia(6, { image: 'images/sejarah-krebet.png', audio: 'audio/sejarah-krebet.wav' });
        });
    }

    if (panorama === '5.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(61.66867499833077, -61.80551619818436, 389.6327924916461), null, () => {
            switchPanorama('3.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-482.94, -33.24, -121.80), null, () => {
            switchPanorama('6.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-117.98691115406146, -45.230478016162486, -378.82184027339326), null, () => {
            switchPanorama('36.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('video', new THREE.Vector3(-425.43, -57.54, -254.88), 'Video Profil', () => {
            showMedia(5, 'https://www.youtube.com/embed/mKU3PBr2ARE?si=mv-XKY0gWJtFW6xL');
        });
    }

    if (panorama === '6.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(497.82, -22.76, -24.60), null, () => {
            switchPanorama('5.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-497.01, -42.90, -19.33), null, () => {
            switchPanorama('33.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('video', new THREE.Vector3(-476.38, -64.36, 133.92), 'Mars Krebet', () => {
            showMedia(2, 'videos/mars.mp4');
        });
    }

    if (panorama === '33.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-398.65305232127207, -25.871103854557305, -4.4590244374591546), null, () => {
            switchPanorama('6.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(398.77267040194437, -18.132482280878172, -6.939524042517586), null, () => {
            switchPanorama('34.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('video', new THREE.Vector3(481.85, -70.59, -110.63), 'Kesenian (1)', () => {
            showMedia(5, 'https://www.youtube.com/embed/Z8nDD9Lg5ug?si=p0G2hSgKVKdCEszq');
        });

        if (previousPanorama === '6.jpg') {
            camera.lookAt(398.77267040194437, -18.132482280878172, -6.939524042517586);
            controls.target.set(398.77267040194437, -18.132482280878172, -6.939524042517586).normalize();
            controls.update();
        }
    }

    if (panorama === '34.jpg') {
        // eslint-disable-next-line no-undef
        addHtmlHotspot('navigate', new THREE.Vector3(-398.3457598626258, -29.817333000518882, -7.411376568996783), null, () => {
            switchPanorama('33.jpg');
        });
        // eslint-disable-next-line no-undef
        addHtmlHotspot('video', new THREE.Vector3(460.54, -56.71, -183.50), 'Kesenian (2)', () => {
            showMedia(5, 'https://www.youtube.com/embed/ULH1EmgYwUU?si=a8FNDl5u3V9YhiFT');
        });
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

    // Tampilkan overlay menggunakan jQuery untuk menjamin animasi berjalan
    // eslint-disable-next-line no-undef
    $('#overlay').css('display', 'flex').hide().fadeIn(300);
    
    // Animasi zoom out sebelum transisi
    targetFov = 90;

    // Tunggu sedikit agar animasi zoom out dan overlay terlihat
    // sebelum thread diblokir oleh TextureLoader (jika gambar besar)
    setTimeout(() => {
        const startTime = Date.now();

        // Mulai load texture baru SEMBARI tetap menampilkan texture lama di bawah overlay
        // eslint-disable-next-line no-undef
        new THREE.TextureLoader().load(`panoramas/${panoramaName}`, (tex) => {
            const elapsed = Date.now() - startTime;
            const remainingDelay = Math.max(0, 500 - elapsed); // pastikan minimal overlay tampil 500ms

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
                // eslint-disable-next-line no-undef
                $('#overlay').fadeOut(400);
            }, remainingDelay);
        });
    }, 350); // Jeda awal 350ms agar jQuery fadeIn sempat terlihat
}

/* ========================================
 * FUNCTION: addHtmlHotspot
 * Buat elemen HTML hotspot dan daftarkan
 * ke htmlHotspots untuk diproyeksikan tiap frame.
 * type: 'navigate' | 'info' | 'video'
 * ======================================== */
function addHtmlHotspot(type, position, label, onClickCallback) {
    const layer = document.getElementById('hotspot-layer');
    if (!layer) return;

    // Pilih ikon berdasarkan tipe
    const iconMap = {
        navigate: '<i class="fa-solid fa-chevron-up"></i>',
        info:     '<i class="fa-solid fa-image"></i>',
        video:    '<i class="fa-solid fa-play"></i>',
    };

    const el = document.createElement('div');
    el.className = `hs hs-${type}`;
    el.innerHTML = `
        <div class="hs-icon">${iconMap[type] || iconMap.info}</div>
        ${label ? `<span class="hs-label">${label}</span>` : ''}
    `;

    // Klik langsung di elemen HTML
    el.addEventListener('click', () => {
        if (onClickCallback) onClickCallback();
    });

    layer.appendChild(el);
    htmlHotspots.push({ el, pos3D: position.clone() });
}

/* ========================================
 * FUNCTION: clearHotspots
 * Hapus semua HTML hotspot dari DOM.
 * ======================================== */
function clearHotspots() {
    const layer = document.getElementById('hotspot-layer');
    if (layer) layer.innerHTML = '';
    htmlHotspots = [];
}

/* ========================================
 * FUNCTION: onPointerMove
 * Ubah kursor saat hover di atas hotspot.
 * (Hover visual kini ditangani CSS :hover)
 * ======================================== */
function onPointerMove(event) {
    if (pickerMode) {
        renderer.domElement.style.cursor = 'crosshair';
    } else {
        renderer.domElement.style.cursor = 'grab';
    }
    // Biarkan mouse.x & mouse.y tetap di-track untuk keperluan lain
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
 * Game loop — FOV animasi + proyeksi hotspot HTML.
 * ======================================== */
function animate() {
    requestAnimationFrame(animate);

    /* Smooth FOV interpolation */
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();

    /* Proyeksikan setiap HTML hotspot dari 3D ke 2D layar */
    // eslint-disable-next-line no-undef
    const vec = new THREE.Vector3();
    htmlHotspots.forEach(({ el, pos3D }) => {
        vec.copy(pos3D);
        vec.project(camera);

        // Jika w < 0, posisi ada di belakang kamera — sembunyikan
        const isBehind = vec.z > 1;
        if (isBehind) {
            el.classList.add('hs-hidden');
            return;
        }
        el.classList.remove('hs-hidden');

        // Konversi NDC (-1..1) ke pixel layar
        const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
    });

    controls.update();
    renderer.render(scene, camera);
}

/*customjs*/
/*customjs-end*/
