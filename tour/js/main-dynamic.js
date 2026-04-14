import { fetchAllByDateDesc } from './services/firebase-service.js';

// --- FUNGSI LOAD PRODUK DARI FIREBASE ---
async function loadDynamicProducts() {
    const container = document.getElementById('produkContainer');
    if (!container) return;

    container.innerHTML = '<div class="swiper-slide d-flex justify-content-center"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        const products = await fetchAllByDateDesc("products");

        if (products.length === 0) {
            container.innerHTML = '<div class="swiper-slide text-center"><p>Belum ada produk.</p></div>';
            return;
        }

        let slidesHTML = '';

        products.forEach((data) => {
            const hargaIndo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.harga);
            const nomorWA = data.wa || "62818270657";
            const pesanWA = `Halo, saya tertarik dengan produk *${data.nama}* seharga ${hargaIndo}. Apakah masih tersedia?`;
            const linkWA = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesanWA)}`;

            slidesHTML += `
            <div class="swiper-slide">
                <div class="card border-0 align-items-center" style="width: 100%; max-width: 400px;">
                    <img src="${data.foto}" class="card-img-top rounded" alt="${data.nama}" 
                         style="height: 400px; object-fit: contain; background-color: #f8f9fa;">
                    
                    <div class="card-body w-100">
                        <div class="text-center mb-2">
                            <h5 class="mb-0 fw-bold">${data.nama}</h5>
                            <small class="text-muted">${hargaIndo}</small>
                        </div>
                        <a href="${linkWA}" target="_blank" class="btn btn-success w-100 rounded-pill py-3 fw-bold">
                            <i class="fa-brands fa-whatsapp me-2"></i> Pesan Sekarang
                        </a>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = slidesHTML;

        // eslint-disable-next-line no-undef
        new Swiper(".mySwiperProduk", {
            observer: true, observeParents: true, slidesPerView: 1, spaceBetween: 30, loop: true,
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            pagination: { el: ".swiper-pagination", clickable: true },
        });

    } catch (error) {
        console.error("Gagal memuat produk:", error);
        container.innerHTML = `<div class="swiper-slide text-center text-danger"><p>Gagal memuat data.</p></div>`;
    }
}

// --- FUNGSI LOAD KESENIAN (YOUTUBE) ---
async function loadDynamicArts() {
    const container = document.getElementById('kesenianContainer');
    if (!container) return;

    container.innerHTML = '<div class="swiper-slide d-flex justify-content-center"><div class="spinner-border text-warning" role="status"></div></div>';

    try {
        const galleries = await fetchAllByDateDesc("galleries");

        if (galleries.length === 0) {
            container.innerHTML = '<div class="swiper-slide text-center"><p>Belum ada video kesenian.</p></div>';
            return;
        }

        let slidesHTML = '';
        
        galleries.forEach((data) => {
            slidesHTML += `
            <div class="swiper-slide">
                <div class="d-flex flex-column w-100 h-100">
                    <div class="ratio ratio-16x9">
                        <iframe src="${data.link}" title="${data.nama}" allowfullscreen></iframe>
                    </div>
                    <div class="bg-light p-3 text-center" style="color: black;">
                        <h5 class="mb-0">${data.nama}</h5>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = slidesHTML;

        // eslint-disable-next-line no-undef
        new Swiper(".mySwiper", {
            observer: true, observeParents: true, slidesPerView: 1, spaceBetween: 30,
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            pagination: { el: ".swiper-pagination", clickable: true },
        });

    } catch (error) {
        console.error("Gagal memuat kesenian:", error);
        container.innerHTML = `<div class="swiper-slide text-center text-danger"><p>Gagal memuat data.</p></div>`;
    }
}

// --- FUNGSI LOAD KELOMPOK SENI ---
async function loadDynamicGroups() {
    const container = document.getElementById('listKelompok');
    if (!container) return;

    try {
        const groups = await fetchAllByDateDesc("groups");

        if (groups.length === 0) {
            container.innerHTML = '<li class="list-group-item text-center">Belum ada data kelompok seni.</li>';
            return;
        }

        let listHTML = '';
        
        groups.forEach((data) => {
            listHTML += `
                <li class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <h6 class="mb-1 fw-bold text-dark">
                            <i class="fa-solid fa-users-rectangle me-2 text-warning"></i>${data.nama}
                        </h6>
                    </div>
                    <p class="mb-1 small text-muted">${data.deskripsi}</p>
                </li>
            `;
        });

        container.innerHTML = listHTML;

    } catch (error) {
        console.error("Gagal memuat kelompok:", error);
        container.innerHTML = `<li class="list-group-item text-danger text-center">Gagal memuat data.</li>`;
    }
}

// --- FUNGSI LOAD BERITA ---
async function loadDynamicNews() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;

    try {
        const newsList = await fetchAllByDateDesc("news");

        if (newsList.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Belum ada berita terbaru.</p></div>';
            return;
        }

        let html = '';
        
        newsList.forEach((data) => {
            const plainText = data.isi.replace(/<[^>]+>/g, '');
            const excerpt = plainText.substring(0, 100) + '...';

            html += `
            <div class="col-md-6">
                <div class="card h-100 shadow-sm border-0">
                    <img src="${data.foto || 'images/default.png'}" class="card-img-top" alt="${data.judul}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <small class="text-muted mb-1">
                            <i class="fa-regular fa-calendar-alt"></i> ${data.tanggal}
                        </small>
                        <h5 class="card-title fw-bold">${data.judul}</h5>
                        <p class="card-text text-secondary small flex-grow-1">${excerpt}</p>
                        <button class="btn w-100 mt-2 btn-read-news text-white" style="background-color: #8B4513;" data-id="${data.id}">
                            Baca Selengkapnya
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        document.querySelectorAll('.btn-read-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const selectedNews = newsList.find(n => n.id === id);
                openNewsDetail(selectedNews);
            });
        });

    } catch (error) {
        console.error("Gagal memuat berita:", error);
        container.innerHTML = `<div class="col-12 text-danger text-center">Gagal memuat berita.</div>`;
    }
}

// Fungsi Buka Modal Detail Berita
function openNewsDetail(data) {
    if (!data) return;

    document.getElementById('detailNewsTitle').innerText = data.judul;
    document.getElementById('detailNewsDate').innerText = data.tanggal;
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
    if(listModal) listModal.hide();

    detailModal.show();
}

// Inisialisasi awal
function initAllDynamics() {
    loadDynamicProducts();
    loadDynamicArts();
    loadDynamicGroups();
    loadDynamicNews();
}

initAllDynamics();