/**
 * ui-controller.js — WotaScape Virtual Tour
 * ============================================================
 * Mengatur interaksi UI, state suara, fullscreen, dan modal.
 * Mengekspor method untuk di-import oleh `tour-3d.js` serta
 * meng-expose global function ke `window` untuk event `onclick`.
 * ============================================================
 */

import { getControls, getTargetFov, setTargetFov, togglePicker } from '../core/tour-3d.js';

// ===== REFERENSI ELEMEN DOM =====
const audioElement  = document.getElementById('bgAudio');
const soundButton   = document.getElementById('btnSound');

/** Status apakah backsound sedang diputar */
export let isPlaying = false;

/**
 * Toggle backsound gamelan on/off.
 */
function toggleSound() {
    if (isPlaying) {
        audioElement.pause();
        soundButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else {
        audioElement.play().catch(err => {
            console.warn('Autoplay diblokir browser:', err);
        });
        soundButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
    isPlaying = !isPlaying;
}

/**
 * Zoom In kamera Three.js
 */
function customZoomIn() {
    setTargetFov(Math.max(getTargetFov() - 10, 30));
}

/**
 * Zoom Out kamera Three.js
 */
function customZoomOut() {
    setTargetFov(Math.min(getTargetFov() + 10, 100));
}

/**
 * Toggle auto-rotate panorama
 */
function toggleAutoRotate() {
    const controls = getControls();
    if(controls) {
        controls.autoRotate = !controls.autoRotate;
    }
}

/**
 * Toggle modal peta Google Maps via Bootstrap Modal.
 */
function toggleMap() {
    // eslint-disable-next-line no-undef
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPeta'));
    modal.toggle();
}

/**
 * Toggle mode fullscreen browser.
 */
function toggleFullscreen() {
    const doc   = window.document;
    const docEl = doc.documentElement;

    const requestFs = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const exitFs = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    const isFullscreen = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

    if (!isFullscreen) {
        if (requestFs) requestFs.call(docEl);
        else alert('Maaf, browser Anda tidak mendukung fitur Fullscreen.');
    } else {
        if (exitFs) exitFs.call(doc);
    }
}

/**
 * Tampilkan modal media. Diakses oleh Hotspot dari tour-3d.js
 */
export function showMedia(type, content) {
    const modalContentEl = document.getElementById('modalMediaContent');
    const modalEl = document.getElementById('modalMedia');
    if (!modalEl || !modalContentEl) return;
    
    // eslint-disable-next-line no-undef
    const modal = new bootstrap.Modal(modalEl);
    const bgAudio = document.getElementById('bgAudio');

    let needToResume = false;
    if (isPlaying && (type === 2 || type === 3 || type === 5 || type === 6)) {
        bgAudio.pause();
        needToResume = true;
    }

    const templates = {
        1: `<img src="${content}" class="img-fluid rounded" style="max-height:70vh;" alt="Detail Info">`,
        2: `<div class="ratio ratio-16x9"><video controls autoplay style="width:100%;height:100%;"><source src="${content}" type="video/mp4">Browser Anda tidak mendukung video.</video></div>`,
        3: `<div class="p-5 text-white"><i class="fa-solid fa-music fa-3x mb-3 text-warning"></i><br><audio controls autoplay style="width:100%;"><source src="${content}" type="audio/mpeg"></audio></div>`,
        4: `<iframe src="${content}" style="width:100%;height:500px;border:none;"></iframe>`,
        5: `<div class="ratio ratio-16x9"><iframe src="${content}" title="YouTube video player" allowfullscreen></iframe></div>`,
        6: `<div class="d-flex flex-column align-items-center w-100 p-3">
                <img src="${content.image}" class="img-fluid rounded mb-3" style="max-height:55vh;width:auto;" alt="Detail Image">
                <div class="w-100 p-3 rounded" style="background:rgba(255,255,255,0.1);">
                    <audio controls autoplay style="width:100%;">
                        <source src="${content.audio}" type="audio/mpeg">
                        <source src="${content.audio}" type="audio/ogg">
                    </audio>
                </div>
            </div>`,
    };

    modalContentEl.innerHTML = templates[type] || '';
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => {
        modalContentEl.innerHTML = '';
        if (needToResume && isPlaying) {
            bgAudio.play().catch(e => console.warn('Resume audio diblokir:', e));
        }
    }, { once: true });
}

// ===== EVENT LISTENERS MODAL KESENIAN =====
(function initKesenianModalListeners() {
    const modalKesenianEl = document.getElementById('modalKesenian');
    if (!modalKesenianEl) return;

    let shouldResumeAudio = false;

    modalKesenianEl.addEventListener('show.bs.modal', () => {
        if (isPlaying) {
            audioElement.pause();
            shouldResumeAudio = true;
        }
    });

    modalKesenianEl.addEventListener('hidden.bs.modal', () => {
        modalKesenianEl.querySelectorAll('iframe').forEach(iframe => {
            iframe.src = iframe.src;
        });
        if (shouldResumeAudio && isPlaying) {
            audioElement.play().catch(err => console.warn('Resume audio gagal:', err));
        }
        shouldResumeAudio = false;
    });
})();

// Meng-expose function ke GLOBAL window supaya onclick="" HTML berfungsi
window.toggleSound = toggleSound;
window.customZoomIn = customZoomIn;
window.customZoomOut = customZoomOut;
window.toggleAutoRotate = toggleAutoRotate;
window.toggleMap = toggleMap;
window.toggleFullscreen = toggleFullscreen;
window.togglePicker = togglePicker;
