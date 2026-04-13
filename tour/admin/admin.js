import { auth, db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, limit, startAfter, endBefore, limitToLast, signOut, onAuthStateChanged }
    from '../js/firebase-config.js';

// --- INISIALISASI TINYMCE ---
tinymce.init({
    selector: '#newsIsi', // Target ke ID textarea
    height: 300,
    menubar: false,
    plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
});

// --- KONFIGURASI ---
const CLOUD_NAME = "dothvi6d9"; // Ganti jika berbeda
const UPLOAD_PRESET = "kavviar-preset"; // Ganti jika berbeda
const ITEMS_PER_PAGE = 5; // Jumlah data per halaman

// Variabel untuk Pagination
let lastDocs = { products: null, news: null, galleries: null, groups: null };
let firstDocs = { products: null, news: null, galleries: null, groups: null };

// --- 1. CEK LOGIN & LOAD DATA AWAL ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        console.log("Login sebagai:", user.email);
        // Load data halaman pertama untuk semua tab
        loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk');
        loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita');
        loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian');
        loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok');
    }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// --- 2. FUNGSI UPLOAD GAMBAR (CLOUDINARY) ---
async function uploadToCloudinary(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Upload Error:", error);
        throw new Error("Gagal upload gambar");
    }
}

// ==========================================
// 3. FUNGSI READ DATA (PAGINATION)
// ==========================================
async function loadData(colName, tableId, renderFunc, nextBtnId, prevBtnId, direction = 'first') {
    const tableBody = document.getElementById(tableId);
    const nextBtn = document.getElementById(nextBtnId);
    const prevBtn = document.getElementById(prevBtnId);

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Sedang memuat data...</td></tr>';

    try {
        const colRef = collection(db, colName);
        let q;

        // Logika Query Firebase untuk Pagination
        if (direction === 'next' && lastDocs[colName]) {
            q = query(colRef, orderBy('createdAt', 'desc'), startAfter(lastDocs[colName]), limit(ITEMS_PER_PAGE));
        } else if (direction === 'prev' && firstDocs[colName]) {
            q = query(colRef, orderBy('createdAt', 'desc'), endBefore(firstDocs[colName]), limitToLast(ITEMS_PER_PAGE));
        } else {
            // Halaman Pertama
            q = query(colRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
        }

        const snapshot = await getDocs(q);
        tableBody.innerHTML = ''; // Bersihkan loading

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data.</td></tr>';
            nextBtn.disabled = true;
            if (direction === 'first') prevBtn.disabled = true;
            return;
        }

        // Simpan dokumen pertama & terakhir untuk navigasi selanjutnya
        firstDocs[colName] = snapshot.docs[0];
        lastDocs[colName] = snapshot.docs[snapshot.docs.length - 1];

        // Render Data ke Tabel
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id; // Sertakan ID dokumen agar bisa diedit/hapus
            tableBody.innerHTML += renderFunc(data);
        });

        // Atur status tombol Next/Prev
        prevBtn.disabled = (direction === 'first' || !firstDocs[colName]);
        nextBtn.disabled = (snapshot.docs.length < ITEMS_PER_PAGE);

    } catch (error) {
        console.error("Load Error:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${error.message}</td></tr>`;
    }
}

// --- FUNGSI RENDER BARIS TABEL (HTML) ---
function renderProduk(data) {
    // Stringify data agar bisa dikirim ke fungsi edit
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr>
        <td><img src="${data.foto || 'https://via.placeholder.com/50'}" class="img-thumb" style="width:50px; height:50px; object-fit:cover;"></td>
        <td>${data.nama}</td>
        <td>Rp ${parseInt(data.harga).toLocaleString()}</td>
        <td>${data.wa}</td>
        <td>
            <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-warning btn-sm" onclick="prepareEdit('${data.id}', '${dataStr}', 'produk')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('products', '${data.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

function renderBerita(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr>
        <td><img src="${data.foto || 'https://via.placeholder.com/50'}" class="img-thumb" style="width:50px; height:50px; object-fit:cover;"></td>
        <td>
            <strong>${data.judul}</strong><br>
            <small class="text-muted"><i class="fa-solid fa-user"></i> ${data.penulis || 'Admin'}</small>
        </td>
        <td>${data.tanggal}</td>
        <td>
            <button class="btn btn-warning btn-sm" onclick="prepareEdit('${data.id}', '${dataStr}', 'berita')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('news', '${data.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
    </tr>`;
}

function renderKesenian(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr>
        <td>${data.nama}</td>
        <td><a href="${data.link}" target="_blank">Tonton</a></td>
        <td>
            <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-warning btn-sm" onclick="prepareEdit('${data.id}', '${dataStr}', 'kesenian')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('galleries', '${data.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

function renderKelompok(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr>
        <td>${data.nama}</td>
        <td>${data.deskripsi.substring(0, 50)}...</td>
        <td>
            <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-warning btn-sm" onclick="prepareEdit('${data.id}', '${dataStr}', 'kelompok')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('groups', '${data.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

// ==========================================
// 4. FUNGSI EDIT & DELETE (GLOBAL WINDOW)
// ==========================================

// Agar fungsi bisa dipanggil dari onclick HTML, kita tempel ke object window
window.deleteItem = async (colName, id) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
        try {
            await deleteDoc(doc(db, colName, id));
            alert("Data berhasil dihapus!");
            location.reload();
        } catch (error) {
            alert("Gagal hapus: " + error.message);
        }
    }
};

window.prepareEdit = (id, dataStr, type) => {
    const data = JSON.parse(decodeURIComponent(dataStr));

    if (type === 'produk') {
        document.getElementById('idProduk').value = id;
        document.getElementById('prodNama').value = data.nama;
        document.getElementById('prodHarga').value = data.harga;
        document.getElementById('prodWA').value = data.wa;

        document.getElementById('btnSaveProd').innerHTML = '<i class="fa-solid fa-pen m-2"></i> Update Produk';
        document.getElementById('btnCancelProd').classList.remove('d-none');
        document.getElementById('formProduk').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'berita') {
        document.getElementById('idBerita').value = id;
        document.getElementById('newsJudul').value = data.judul;
        document.getElementById('newsPenulis').value = data.penulis || '';

        // ISI KONTEN KE TINYMCE
        tinymce.get('newsIsi').setContent(data.isi);

        document.getElementById('btnSaveNews').innerHTML = '<i class="fa-solid fa-pen"></i> Update Berita';
        document.getElementById('btnCancelNews').classList.remove('d-none');
        document.getElementById('formBerita').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'kesenian') {
        document.getElementById('idKesenian').value = id;
        document.getElementById('artsNama').value = data.nama;
        document.getElementById('artsLink').value = data.link;

        document.getElementById('btnSaveArts').innerHTML = '<i class="fa-solid fa-pen m-2"></i> Update Kesenian';
        const btnCancel = document.getElementById('btnCancelArts');
        if (btnCancel) btnCancel.classList.remove('d-none');

        document.getElementById('formKesenian').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'kelompok') {
        // --- LOGIKA BARU UNTUK KELOMPOK SENI ---
        document.getElementById('idKelompok').value = id;
        document.getElementById('groupNama').value = data.nama;
        document.getElementById('groupDesc').value = data.deskripsi;

        document.getElementById('btnSaveGroup').innerHTML = '<i class="fa-solid fa-pen m-2"></i> Update Kelompok';
        const btnCancel = document.getElementById('btnCancelGroup');
        if (btnCancel) btnCancel.classList.remove('d-none');

        document.getElementById('formKelompok').scrollIntoView({ behavior: 'smooth' });
    }
};

// --- EVENT LISTENER TOMBOL BATAL (RESET FORM) ---
function resetForm() {
    location.reload();
}

const cancelBtns = ['btnCancelProd', 'btnCancelNews', 'btnCancelArts', 'btnCancelGroup'];
cancelBtns.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.addEventListener('click', resetForm);
    }
});

// ==========================================
// 5. FUNGSI SUBMIT FORM (CREATE & UPDATE)
// ==========================================

// --- PRODUK ---
document.getElementById('formProduk').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idProduk').value; // Cek apakah ini mode Edit?
    const btn = document.getElementById('btnSaveProd');
    btn.disabled = true; btn.innerText = "Memproses...";

    try {
        const fileInput = document.getElementById('prodFoto').files[0];
        let fotoUrl = null;
        if (fileInput) fotoUrl = await uploadToCloudinary(fileInput);

        const payload = {
            nama: document.getElementById('prodNama').value,
            harga: document.getElementById('prodHarga').value,
            wa: document.getElementById('prodWA').value,
            updatedAt: new Date()
        };
        if (fotoUrl) payload.foto = fotoUrl; // Hanya update foto jika ada upload baru

        if (id) {
            // MODE UPDATE
            await updateDoc(doc(db, "products", id), payload);
            alert("Produk Diupdate!");
        } else {
            // MODE CREATE
            if (!fileInput) throw new Error("Foto wajib diupload untuk produk baru!");
            payload.createdAt = new Date();
            if (fotoUrl) payload.foto = fotoUrl; // Pastikan foto masuk
            await addDoc(collection(db, "products"), payload);
            alert("Produk Disimpan!");
        }
        location.reload();
    } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerHTML = 'Simpan Produk';
    }
});

// --- BERITA ---
document.getElementById('formBerita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idBerita').value;
    const btn = document.getElementById('btnSaveNews');

    // AMBIL DATA DARI TINYMCE
    const content = tinymce.get('newsIsi').getContent();

    // Validasi (Cek versi teks polosnya kosong atau tidak)
    if (tinymce.get('newsIsi').getContent({ format: 'text' }).trim().length === 0) {
        alert("Isi berita tidak boleh kosong!");
        return;
    }

    btn.disabled = true; btn.innerText = "Memproses...";

    try {
        const fileInput = document.getElementById('newsFoto').files[0];
        let fotoUrl = null;
        if (fileInput) fotoUrl = await uploadToCloudinary(fileInput);

        const payload = {
            judul: document.getElementById('newsJudul').value,
            penulis: document.getElementById('newsPenulis').value,
            isi: content, // Gunakan konten dari TinyMCE
            updatedAt: new Date()
        };
        if (fotoUrl) payload.foto = fotoUrl;

        if (id) {
            await updateDoc(doc(db, "news", id), payload);
            alert("Berita Diupdate!");
        } else {
            if (!fileInput) throw new Error("Foto wajib!");
            payload.tanggal = new Date().toLocaleDateString('id-ID');
            payload.createdAt = new Date();
            await addDoc(collection(db, "news"), payload);
            alert("Berita Terbit!");
        }
        location.reload();
    } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerHTML = 'Terbitkan';
    }
});

// --- KESENIAN (Simpel tanpa foto) ---
document.getElementById('formKesenian').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idKesenian').value;
    const payload = {
        nama: document.getElementById('artsNama').value,
        link: document.getElementById('artsLink').value,
        updatedAt: new Date()
    };

    if (id) await updateDoc(doc(db, "galleries", id), payload);
    else { payload.createdAt = new Date(); await addDoc(collection(db, "galleries"), payload); }

    alert("Data Tersimpan!");
    location.reload();
});

// --- KELOMPOK ---
document.getElementById('formKelompok').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idKelompok').value;
    const payload = {
        nama: document.getElementById('groupNama').value,
        deskripsi: document.getElementById('groupDesc').value,
        updatedAt: new Date()
    };

    if (id) await updateDoc(doc(db, "groups", id), payload);
    else { payload.createdAt = new Date(); await addDoc(collection(db, "groups"), payload); }

    alert("Data Tersimpan!");
    location.reload();
});

// --- BUTTONS PAGINATION ---
document.getElementById('nextProduk').onclick = () => loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk', 'next');
document.getElementById('prevProduk').onclick = () => loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk', 'prev');

document.getElementById('nextBerita').onclick = () => loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'next');
document.getElementById('prevBerita').onclick = () => loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'prev');

document.getElementById('nextKesenian').onclick = () => loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian', 'next');
document.getElementById('prevKesenian').onclick = () => loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian', 'prev');

document.getElementById('nextKelompok').onclick = () => loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok', 'next');
document.getElementById('prevKelompok').onclick = () => loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok', 'prev');