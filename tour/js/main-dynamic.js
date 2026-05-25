import { fetchAllByDateDesc } from './services/firebase-service.js';

// --- TRACK INISIALISASI SWIPER ---
let swiperProfilInit = false;
let swiperPaketInit = false;
let swiperPenginapanInit = false;

// --- FUNGSI LOAD PROFIL DESA (Video YouTube) ---
async function loadVillageProfiles() {
    const container = document.getElementById('profilContainer');
    if (!container) return;

    try {
        const profiles = await fetchAllByDateDesc("village_profiles");

        if (profiles.length === 0) {
            container.innerHTML = '<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-white-50">Belum ada video profil.</p></div>';
        } else {
            let slidesHTML = '';
            profiles.forEach((data) => {
                let embedLink = data.link || '';
                if (embedLink.includes('watch?v=')) {
                    embedLink = embedLink.replace('watch?v=', 'embed/');
                } else if (embedLink.includes('youtu.be/')) {
                    embedLink = 'https://www.youtube.com/embed/' + embedLink.split('youtu.be/')[1];
                }
                slidesHTML += `
                <div class="swiper-slide">
                    <div class="d-flex flex-column w-100 h-100" style="background:#07120a;">
                        <div class="ratio ratio-16x9">
                            <iframe src="${embedLink}" title="${data.judul}" allowfullscreen style="border:none;"></iframe>
                        </div>
                        <div class="p-3 text-center" style="background:#0d1f10;">
                            <h5 class="mb-0 fw-bold text-white">${data.judul}</h5>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = slidesHTML;
        }

        if (!swiperProfilInit) {
            // eslint-disable-next-line no-undef
            new Swiper(".mySwiperProfil", {
                observer: true, observeParents: true, slidesPerView: 1, spaceBetween: 0,
                navigation: { nextEl: ".mySwiperProfil .swiper-button-next", prevEl: ".mySwiperProfil .swiper-button-prev" },
                pagination: { el: ".mySwiperProfil .swiper-pagination", clickable: true },
            });
            swiperProfilInit = true;
        }
    } catch (error) {
        console.error("Gagal memuat profil:", error);
        container.innerHTML = `<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-danger">Gagal memuat data.</p></div>`;
    }
}

// --- FUNGSI LOAD PAKET WISATA ---
async function loadTourPackages() {
    const container = document.getElementById('paketContainer');
    if (!container) return;

    try {
        const packages = await fetchAllByDateDesc("tour_packages");

        if (packages.length === 0) {
            container.innerHTML = '<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-white-50">Belum ada paket wisata.</p></div>';
        } else {
            let slidesHTML = '';
            packages.forEach((data) => {
                const hargaIndo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.harga);
                const nomorWA = "62818270657";
                const pesanWA = `Halo, saya tertarik dengan paket wisata *${data.nama}* seharga ${hargaIndo}. Apakah bisa dibantu informasinya?`;
                const linkWA = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesanWA)}`;

                slidesHTML += `
                <div class="swiper-slide d-flex justify-content-center align-items-start p-3">
                    <div class="card border-0 text-start w-100" style="max-width: 460px; background: rgba(255,255,255,0.06); border-radius: 1rem; overflow: hidden; color: #f5f0e8; border: 1px solid rgba(74,140,63,0.2);">
                        ${data.foto ? `<img src="${data.foto}" class="card-img-top" alt="${data.nama}" style="height: 230px; object-fit: cover;">` : ''}
                        <div class="card-body p-4 d-flex flex-column">
                            <h4 class="fw-bold mb-1 text-white">${data.nama}</h4>
                            <h5 class="fw-bold mb-3" style="color:#4a8c3f;">${hargaIndo}</h5>
                            <p class="text-white-50 small mb-3 flex-grow-1" style="white-space: pre-line;">${data.deskripsi || ''}</p>
                            ${data.fasilitas ? `<div class="mb-4">
                                <span class="badge mb-2" style="background:rgba(74,140,63,0.3); color:#8fce80;">Fasilitas</span>
                                <p class="small text-white mb-0">${data.fasilitas}</p>
                            </div>` : ''}
                            <a href="${linkWA}" target="_blank" class="btn w-100 py-2 fw-bold mt-auto" style="background:#4a8c3f; color:#fff; border-radius: 0.5rem;">
                                <i class="fa-brands fa-whatsapp me-2"></i> Pesan Paket
                            </a>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = slidesHTML;
        }

        if (!swiperPaketInit) {
            // eslint-disable-next-line no-undef
            new Swiper(".mySwiperPaket", {
                observer: true, observeParents: true, slidesPerView: 1, spaceBetween: 0, loop: false,
                navigation: { nextEl: ".mySwiperPaket .swiper-button-next", prevEl: ".mySwiperPaket .swiper-button-prev" },
                pagination: { el: ".mySwiperPaket .swiper-pagination", clickable: true },
            });
            swiperPaketInit = true;
        }
    } catch (error) {
        console.error("Gagal memuat paket wisata:", error);
        container.innerHTML = `<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-danger">Gagal memuat data.</p></div>`;
    }
}

// --- FUNGSI LOAD PENGINAPAN ---
async function loadAccommodations() {
    const container = document.getElementById('penginapanContainer');
    if (!container) return;

    try {
        const accommodations = await fetchAllByDateDesc("accommodations");

        if (accommodations.length === 0) {
            container.innerHTML = '<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-white-50">Belum ada penginapan.</p></div>';
        } else {
            let slidesHTML = '';
            accommodations.forEach((data) => {
                const hargaIndo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.harga);
                let nomorWA = data.wa || "62818270657";
                if (nomorWA.startsWith('0')) nomorWA = '62' + nomorWA.slice(1);
                else if (nomorWA.startsWith('+62')) nomorWA = '62' + nomorWA.slice(3);
                const pesanWA = `Halo ${data.pemilik}, saya ingin bertanya mengenai ketersediaan kamar di *${data.nama}*.`;
                const linkWA = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesanWA)}`;

                slidesHTML += `
                <div class="swiper-slide d-flex justify-content-center align-items-start p-3">
                    <div class="card border-0 text-start w-100" style="max-width: 460px; background: rgba(255,255,255,0.06); border-radius: 1rem; overflow: hidden; color: #f5f0e8; border: 1px solid rgba(74,140,63,0.2);">
                        ${data.foto ? `<img src="${data.foto}" class="card-img-top" alt="${data.nama}" style="height: 230px; object-fit: cover;">` : ''}
                        <div class="card-body p-4 d-flex flex-column">
                            <h4 class="fw-bold mb-1 text-white">${data.nama}</h4>
                            <div class="d-flex align-items-center mb-2 small" style="color:rgba(245,240,232,0.6);">
                                <i class="fa-solid fa-user me-2"></i> ${data.pemilik}
                            </div>
                            <h5 class="fw-bold mb-4" style="color:#4a8c3f;">${hargaIndo} <span class="small fw-normal" style="color:rgba(245,240,232,0.5);">/ malam</span></h5>
                            <a href="${linkWA}" target="_blank" class="btn w-100 py-2 fw-bold mt-auto" style="background:#4a8c3f; color:#fff; border-radius: 0.5rem;">
                                <i class="fa-brands fa-whatsapp me-2"></i> Hubungi Pemilik
                            </a>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = slidesHTML;
        }

        if (!swiperPenginapanInit) {
            // eslint-disable-next-line no-undef
            new Swiper(".mySwiperPenginapan", {
                observer: true, observeParents: true, slidesPerView: 1, spaceBetween: 0, loop: false,
                navigation: { nextEl: ".mySwiperPenginapan .swiper-button-next", prevEl: ".mySwiperPenginapan .swiper-button-prev" },
                pagination: { el: ".mySwiperPenginapan .swiper-pagination", clickable: true },
            });
            swiperPenginapanInit = true;
        }
    } catch (error) {
        console.error("Gagal memuat penginapan:", error);
        container.innerHTML = `<div class="swiper-slide d-flex justify-content-center align-items-center" style="min-height:380px;"><p class="text-danger">Gagal memuat data.</p></div>`;
    }
}

// --- FUNGSI LOAD BERITA ---
async function loadVillageNews() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;

    try {
        const newsList = await fetchAllByDateDesc("village_news");

        if (newsList.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-4"><p class="text-white-50">Belum ada berita terbaru.</p></div>';
            return;
        }

        let html = '';
        newsList.forEach((data) => {
            const plainText = (data.isi || '').replace(/<[^>]+>/g, '');
            const excerpt = plainText.substring(0, 100) + '...';

            html += `
            <div class="col-md-6">
                <div class="card h-100 shadow-sm border-0" style="background: rgba(255,255,255,0.05); color: #f5f0e8; border: 1px solid rgba(74,140,63,0.15); border-radius: 0.75rem; overflow:hidden;">
                    <img src="${data.foto || 'images/default.png'}" class="card-img-top" alt="${data.judul}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <small class="mb-1" style="color:rgba(245,240,232,0.5);">
                            <i class="fa-regular fa-calendar-alt"></i> ${data.tanggal || ''}
                        </small>
                        <h5 class="card-title fw-bold text-white">${data.judul}</h5>
                        <p class="card-text small flex-grow-1" style="color:rgba(245,240,232,0.6);">${excerpt}</p>
                        <button class="btn w-100 mt-2 btn-read-news text-white fw-semibold" style="background-color: #4a8c3f; border-color: #3d7a5e; border-radius:0.5rem;" data-id="${data.id}">
                            Baca Selengkapnya
                        </button>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        document.querySelectorAll('.btn-read-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('[data-id]').getAttribute('data-id');
                const selectedNews = newsList.find(n => n.id === id);
                openNewsDetail(selectedNews);
            });
        });

    } catch (error) {
        console.error("Gagal memuat berita:", error);
        container.innerHTML = `<div class="col-12 text-danger text-center">Gagal memuat berita.</div>`;
    }
}

// --- FUNGSI BUKA MODAL DETAIL BERITA ---
function openNewsDetail(data) {
    if (!data) return;

    document.getElementById('detailNewsTitle').innerText = data.judul;
    document.getElementById('detailNewsDate').innerText = data.tanggal || '-';
    document.getElementById('detailNewsAuthor').innerText = data.penulis || 'Admin';
    document.getElementById('detailNewsContent').innerHTML = data.isi;

    const imgEl = document.getElementById('detailNewsImg');
    if (data.foto) {
        imgEl.src = data.foto;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    // eslint-disable-next-line no-undef
    const detailModal = new bootstrap.Modal(document.getElementById('modalDetailBerita'));
    // eslint-disable-next-line no-undef
    const listModal = bootstrap.Modal.getInstance(document.getElementById('modalBerita'));
    if (listModal) listModal.hide();

    detailModal.show();
}

// --- INISIALISASI AWAL ---
function initAllDynamics() {
    loadVillageProfiles();
    loadTourPackages();
    loadAccommodations();
    loadVillageNews();
}

initAllDynamics();