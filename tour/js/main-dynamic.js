import { db, collection, getDocs, orderBy, query } from './firebase-config.js';

// --- FUNGSI LOAD PRODUK DARI FIREBASE ---
async function loadDynamicProducts() {
    const container = document.getElementById('produkContainer');

    // Tampilkan loading sementara
    container.innerHTML = '<div class="swiper-slide d-flex justify-content-center"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        // Ambil data produk, urutkan dari yang terbaru
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        // Jika kosong
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="swiper-slide text-center"><p>Belum ada produk.</p></div>';
            return;
        }

        let slidesHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Format Harga (Opsional, jika nanti mau ditampilkan)
            const hargaIndo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.harga);

            // Siapkan Link WA
            // Jika admin lupa isi WA, gunakan nomor default
            const nomorWA = data.wa || "62818270657";
            const pesanWA = `Halo, saya tertarik dengan produk *${data.nama}* seharga ${hargaIndo}. Apakah masih tersedia?`;
            const linkWA = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesanWA)}`;

            // Generate HTML Slide (Sesuai Desain "Foto + Tombol" Anda)
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

        // Masukkan ke HTML
        container.innerHTML = slidesHTML;

        // --- INISIALISASI SWIPER (PENTING!) ---
        // Kita harus init swiper SETELAH datanya masuk agar slider berfungsi
        new Swiper(".mySwiperProduk", {
            observer: true,
            observeParents: true,
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true, // Bisa di-loop jika data > 1
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });

    } catch (error) {
        console.error("Gagal memuat produk:", error);
        container.innerHTML = `<div class="swiper-slide text-center text-danger"><p>Gagal memuat data: ${error.message}</p></div>`;
    }
}

// Jalankan fungsi saat file ini dimuat
loadDynamicProducts();

// --- FUNGSI LOAD KESENIAN (YOUTUBE) ---
async function loadDynamicArts() {
    const container = document.getElementById('kesenianContainer');
    if (!container) return; // Jaga-jaga jika elemen tidak ditemukan

    container.innerHTML = '<div class="swiper-slide d-flex justify-content-center"><div class="spinner-border text-warning" role="status"></div></div>';

    try {
        // Ambil data kesenian, urutkan dari yang terbaru
        const q = query(collection(db, "galleries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="swiper-slide text-center"><p>Belum ada video kesenian.</p></div>';
            return;
        }

        let slidesHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Generate Slide Video
            slidesHTML += `
            <div class="swiper-slide">
                <div class="d-flex flex-column w-100 h-100">
                    <div class="ratio ratio-16x9">
                        <iframe src="${data.link}" title="${data.nama}" allowfullscreen></iframe>
                    </div>
                    <div class="bg-light text-white p-3 text-center" style="color: white;">
                        <h5 class="mb-0">${data.nama}</h5>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = slidesHTML;

        // --- INIT SWIPER KESENIAN ---
        new Swiper(".mySwiper", {
            observer: true,
            observeParents: true,
            slidesPerView: 1,
            spaceBetween: 30,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });

    } catch (error) {
        console.error("Gagal memuat kesenian:", error);
        container.innerHTML = `<div class="swiper-slide text-center text-danger"><p>Gagal memuat data.</p></div>`;
    }
}

// Panggil fungsi
loadDynamicArts();


// --- FUNGSI LOAD KELOMPOK SENI ---
async function loadDynamicGroups() {
    const container = document.getElementById('listKelompok');
    if (!container) return;

    try {
        // Ambil data kelompok, urutkan dari yang terbaru
        const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<li class="list-group-item text-center">Belum ada data kelompok seni.</li>';
            return;
        }

        let listHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Generate List Item
            // Kita gunakan format Nama tebal, deskripsi kecil di bawahnya
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
        container.innerHTML = `<li class="list-group-item text-danger text-center">Gagal memuat data: ${error.message}</li>`;
    }
}

// Panggil fungsi
loadDynamicGroups();

// --- FUNGSI LOAD BERITA ---
async function loadDynamicNews() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;

    try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Belum ada berita terbaru.</p></div>';
            return;
        }

        let html = '';
        let newsData = []; // Simpan data di array lokal agar mudah diambil detailnya

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id; // Simpan ID
            newsData.push(data);

            // Potong isi berita untuk preview (hapus tag HTML dulu biar rapi)
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
                        <button class="btn btn-outline-primary w-100 mt-2 btn-read-news" data-id="${data.id}">
                            Baca Selengkapnya
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        // --- TAMBAHKAN EVENT LISTENER KE TOMBOL "BACA" ---
        document.querySelectorAll('.btn-read-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const selectedNews = newsData.find(n => n.id === id);
                openNewsDetail(selectedNews);
            });
        });

    } catch (error) {
        console.error("Gagal memuat berita:", error);
        container.innerHTML = `<div class="col-12 text-danger text-center">Gagal memuat berita: ${error.message}</div>`;
    }
}

// Fungsi Buka Modal Detail
function openNewsDetail(data) {
    if (!data) return;

    // Isi Konten Modal Detail
    document.getElementById('detailNewsTitle').innerText = data.judul;
    document.getElementById('detailNewsDate').innerText = data.tanggal;
    document.getElementById('detailNewsAuthor').innerText = data.penulis || 'Admin';
    document.getElementById('detailNewsContent').innerHTML = data.isi; // Render HTML dari TinyMCE

    // Handle Gambar Utama
    const imgEl = document.getElementById('detailNewsImg');
    if (data.foto) {
        imgEl.src = data.foto;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    // Buka Modal Detail (Tutup Modal List dulu otomatis oleh Bootstrap toggle)
    const detailModal = new bootstrap.Modal(document.getElementById('modalDetailBerita'));
    // Tutup modal list manual agar tidak tumpang tindih backdrop
    const listModalEl = document.getElementById('modalBerita');
    const listModal = bootstrap.Modal.getInstance(listModalEl);
    if(listModal) listModal.hide();

    detailModal.show();
}

// Panggil fungsi
loadDynamicNews();