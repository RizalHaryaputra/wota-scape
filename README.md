# KAVVIAR - Krebet Arts Village Virtual Reality 🎭🌿

**KAVVIAR** adalah platform wisata virtual berbasis web yang menghadirkan keindahan dan keunikan **Desa Wisata Krebet** di Bantul, Yogyakarta, langsung ke layar Anda. Proyek ini memungkinkan pengguna untuk menjelajahi sentra kerajinan Batik Kayu secara interaktif melalui panorama 360 derajat.

---

## ✨ Fitur Utama

### 🌍 1. Virtual Tour 360° (Frontend)
- **Immersive Experience:** Menjelajahi 30+ titik lokasi desa dengan panorama 360 derajat.
- **Dynamic Data:** Data Produk, Video Kesenian, dan Berita diambil langsung dari *Cloud Database* (Firebase).
- **Interactive Hotspots:**
  - **Info Spots:** Popup multimedia (Gambar + Audio Narasi).
  - **Navigation Spots:** Perpindahan lokasi yang mulus (*smooth transition*).
- **Smart Audio:** Musik latar Gamelan yang otomatis *fade-out* saat video atau narasi diputar.
- **Mobile Optimized:** Kontrol sentuh yang responsif, *lazy loading* gambar, dan memori yang efisien untuk HP (Android/iOS).
- **Fitur Lengkap:** Zoom In/Out, Auto-Rotate, Mini Map, dan Fullscreen mode.

### ⚙️ 2. Admin Dashboard (Backend)
Halaman khusus pengelola untuk memanajemen konten website:
- **Secure Login:** Sistem autentikasi admin yang aman.
- **Manajemen Berita (Blog):**
  - Tulis berita dengan **Rich Text Editor (TinyMCE)** (Bold, Italic, List, dll).
  - Upload foto berita otomatis ke Cloudinary.
- **Manajemen Produk (E-Catalog):**
  - Tambah/Edit/Hapus produk kerajinan.
  - Integrasi tombol WhatsApp otomatis ke nomor pengrajin.
- **Manajemen Galeri & Profil:**
  - Kelola video kesenian (YouTube Link) dan data kelompok seni.
- **Real-time Updates:** Perubahan di admin langsung tampil di halaman depan detik itu juga.

---

## 🔧 Teknologi yang Digunakan

**Frontend:**
- **Core:** HTML5, CSS3, JavaScript (ES6+ Modules)
- **3D Engine:** [Three.js](https://threejs.org/) (Custom Panorama Controls)
- **UI Framework:** [Bootstrap 5](https://getbootstrap.com/)
- **Media Sliders:** [Swiper.js](https://swiperjs.com/)
- **Text Editor:** [TinyMCE](https://www.tiny.cloud/) (Untuk Admin)

**Backend & Cloud Services:**
- **Database:** [Google Firebase Firestore](https://firebase.google.com/) (NoSQL Realtime Database)
- **Authentication:** Firebase Auth (Admin Security)
- **Media Storage:** [Cloudinary](https://cloudinary.com/) (Optimasi & Penyimpanan Gambar)
- **Hosting:** Vercel / Netlify / GitHub Pages

---

## 📂 Struktur Folder

```text
KAVVIAR/
├── index.html              # Landing Page (Halaman Sambutan)
├── videos/                 # Aset video background Landing Page
│   └── videoplayback.mp4
├── krebet-tour/            # Aplikasi Utama Virtual Tour
│   ├── index.html          # Kode Utama Tour 360
│   ├── style.css           # Kustomisasi Tampilan
│   ├── js/                 # Logika JavaScript (Three.js, OrbitControls, dll)
│   ├── css/                # Library CSS tambahan
│   ├── panoramas/          # Gambar-gambar 360 (JPG Equirectangular)
│   ├── images/             # Aset gambar produk, ikon hotspot, dll
│   └── audio/              # Musik latar & narasi
└── README.md               # Dokumentasi Proyek
```

---

## 🚀 Cara Menjalankan (Local)

1.  **Clone atau Download** repository ini.
2.  Buka folder proyek menggunakan **VS Code**.
3.  Pastikan ekstensi **Live Server** sudah terinstal di VS Code.
4.  Klik kanan pada file `index.html` (yang berada di folder terluar/root), lalu pilih **"Open with Live Server"**.
5.  Website akan otomatis terbuka di browser (biasanya di alamat `http://127.0.0.1:5500`).

## 🌐 Deployment

Proyek ini sudah dioptimasi untuk layanan hosting statis seperti **Netlify** dan **GitHub Pages**.

**Pengaturan Penting saat Deploy:**
* **Root Directory:** Biarkan kosong (`./`) atau set ke *root project* agar Landing Page (halaman sambutan) terbaca pertama kali.
* **Case Sensitivity:** Server hosting (Linux) sangat sensitif terhadap huruf besar/kecil. Pastikan penulisan nama file di kode (misal `src="js/three.min.js"`) sama persis dengan nama file aslinya.

---

## 📝 Kredit

* **Lokasi:** Desa Wisata Krebet, Bantul, Yogyakarta.
* **Pengembang:** Rizal Haryaputra
* **Sumber Aset:**
    * Panorama: Google Street View / Dokumentasi Pribadi.

---
*Dibuat sebagai bagian dari upaya digitalisasi pariwisata Indonesia.*
