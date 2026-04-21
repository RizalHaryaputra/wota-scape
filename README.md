# WotaScape - Virtual Tour 360° Desa Wota Wati 🌍🍃

**WotaScape** adalah platform wisata virtual berbasis web modern yang menghadirkan keindahan, pesona alam, serta kebudayaan **Desa Wota Wati** di Gunung Kidul, Yogyakarta, secara langsung ke dalam layar Anda. Proyek ini memungkinkan pengguna mengeksplorasi dan menjelajahi desa secara interaktif melalui panorama 360 derajat yang imersif.

---

## ✨ Fitur Utama

### 🌍 1. Virtual Tour 360° (Frontend)
- **Immersive Experience:** Menjelajahi berbagai titik lokasi desa dengan panorama 360 derajat resolusi tinggi.
- **Dynamic Content:** Konten pendukung seperti Info Spot dan data turistik lainnya ditarik secara dinamis dari Cloud Database (Firebase).
- **Interactive Hotspots:**
  - **Info Spots:** Informasi multimedia detail untuk menambah wawasan pengunjung tentang desa.
  - **Navigation Spots:** Transisi perpindahan antarlokasi di dalam tour yang dirancang lebih mulus dan dioptimisasi.
- **Audio Latar & Suasana:** Integrasi audio lingkungan lokal secara optimal di setiap scene untuk menambahkan nuansa imersif yang nyata.
- **Responsive & Premium Design:** Tampilan antarmuka (UI) telah diperbarui total menggunakan **Tailwind CSS**. Mengusung tema alam (nature-inspired), modern, dan *vibrant* dengan animasi responsif yang sangat mulus bagi perangkat mobile maupun desktop.
- **Fitur Pelengkap:** Auto-rotate, fungsi Zoom In/Out pintar, integrasi Peta navigasi (*Map*), dan kapabilitas mode Fullscreen.

### ⚙️ 2. Admin Dashboard (Backend/CMS)
Berisi halaman panel (*dashboard*) berdedikasi yang dirancang untuk pengelola kawasan / administrator:
- **Service-Oriented Firebase Layer:** Struktur kodenya dipecah menjadi *services module* terpisah untuk mempermudah skalabilitas dan pemeliharaan logika Firebase.
- **Secure Authentication:** Mekanisme akses dan *login* *layer* khusus Admin.
- **Real-Time Data Management:** Administrator dapat melakukan kontrol terhadap *Hotspot*, Informasi tambahan, atau data desa, lalu secara instan diteruskan perubahannya (*sync*) ke *live website* para pemirsa.

---

## 🔧 Teknologi yang Digunakan

**Frontend:**
- **Core:** HTML5, Vanilla JS (Arsitektur ES6+ Modules)
- **3D Engine:** [Three.js](https://threejs.org/) (Panorama Engine)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Premium UI & Utility-First)
- **Iconography:** FontAwesome
- **Typhography:** Google Fonts (Inter, Playfair Display)

**Backend & Cloud Services:**
- **Database:** [Google Firebase Firestore](https://firebase.google.com/) (NoSQL Realtime Database)
- **Authentication:** Firebase Client Auth
- **Penyimpanan File:** Tersedia skema penyatuan dengan Cloud Storage
- **Deployment Pipeline:** Siap digunakan (*production-ready*) untuk Vercel / Netlify / GitHub Pages

---

## 📂 Struktur Direktori

```text
WotaScape/
├── index.html              # Main Landing Page / Welcome Screen (Akses pertama)
├── videos/                 # Berisi video background untuk Landing Page
├── tour/                   # Aplikasi Utama Virtual Tour 360°
│   ├── index.html          # Canvas Utama Tour 360
│   ├── js/                 # Logika Modular JS (Three.js config, Firestore Services dll)
│   ├── admin/              # Panel CMS / Dashboard Login Admin
│   ├── css/                # Konfigurasi file custom style tambahan
│   ├── panoramas/          # Menyimpan aset gambar 360° (Format Equirectangular JPG)
│   ├── images/             # Gambar statis, aset UI/UX, dan branding logo
│   ├── audio/              # File Audio (BGM, Voice Over, Ambience)
│   └── WTMProject.wtm      # Konfigurasi internal / Metadata data panorama project
└── README.md               # Dokumentasi Proyek
```

---

## 🚀 Cara Menjalankan (Local Development)

1.  **Clone** repositori proyek ini, atau unduh sebagai ZIP lalu ekstrak.
2.  Buka *root directory* folder (`WotaScape`) menggunakan **Visual Studio Code (VS Code)**.
3.  Pastikan ekstensi populer **Live Server** telah terpasang di VS Code Anda.
4.  Klik kanan pada berkas `index.html` (di luaran/root), kemudian klik dan pilih **"Open with Live Server"**.
5.  *Browser* default Anda akan terbuka dan seketika langsung menjalankan aplikasi di `http://127.0.0.1:5500`.

## 🌐 Panduan Deployment (Produksi)

Sebagai proyek *Single Page Application* yang diprioritaskan untuk pemuatan klien statik (frontend), proyek ini dapat ditingkatkan kodenya tanpa kerumitan:

*   **Pilih Root Direktori:** Jika menggunakan Vercel/Netlify, atur *Build/Publish Directory* ke posisi kosong / root folder (`./`). Hal ini memastikan sistem membaca _landing page_ awal.
*   **Case Sensitivity Server:** Platform *hosting* berbasis sistem operasi Linux bersifat super sensitif pada penamaan file huruf besar/kecil. Hindari merubah file ke huruf besar di direktori *lokal windows* yang tidak dilacak tepat oleh *git cache*.

---

## 📝 Kredit & Atribusi

*   **Destinasi Tour Virtual:** Desa Wota Wati, Pucung, Girisubo, Gunung Kidul, DI Yogyakarta.
*   **Pengembang Piranti Lunak:** Rizal Haryaputra
*   **Sumber Aset Konten:** Dokumentasi Resmi Pribadi & Google Street View.

---
*Dikembangkan secara khusus sebagai wujud nyata karya cipta dan sumbangsih pendigitalisasian dunia pariwisata bumi nusantara.*
