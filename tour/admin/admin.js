import { auth, signOut, onAuthStateChanged } from '../js/firebase-config.js';
import { getPaginatedData, createItem, updateItem, removeItem } from '../js/services/firebase-service.js';

// ==========================================
// KONFIGURASI
// ==========================================
const CLOUD_NAME = 'dothvi6d9';
const UPLOAD_PRESET = 'kavviar-preset';
const ITEMS_PER_PAGE = 5;

// State pagination untuk setiap koleksi
let lastDocs = { products: null, news: null, galleries: null, groups: null };
let firstDocs = { products: null, news: null, galleries: null, groups: null };

// ==========================================
// INISIALISASI TINYMCE
// ==========================================
// eslint-disable-next-line no-undef
tinymce.init({
    selector: '#newsIsi',
    height: 300,
    menubar: false,
    plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | removeformat | help',
    content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; }'
});

// ==========================================
// 1. CEK AUTH & LOAD DATA AWAL
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        console.log('Login sebagai:', user.email);
        loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk');
        loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita');
        loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian');
        loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok');
    }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'index.html');
});

// ==========================================
// 2. UPLOAD GAMBAR KE CLOUDINARY
// ==========================================
async function uploadToCloudinary(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Gagal mengupload gambar ke server.');
    }
}

// ==========================================
// 3. LOAD DATA DENGAN PAGINATION
// ==========================================
async function loadData(colName, tableId, renderFunc, nextBtnId, prevBtnId, direction = 'first') {
    const tableBody = document.getElementById(tableId);
    const nextBtn = document.getElementById(nextBtnId);
    const prevBtn = document.getElementById(prevBtnId);

    tableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400 text-sm">
        <i class="fa-solid fa-spinner animate-spin mr-2"></i>Memuat data...
    </td></tr>`;

    try {
        const result = await getPaginatedData(colName, ITEMS_PER_PAGE, direction, lastDocs[colName], firstDocs[colName]);
        tableBody.innerHTML = '';

        if (result.empty) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 text-sm">
                <i class="fa-regular fa-folder-open text-2xl mb-2 block"></i>Belum ada data.
            </td></tr>`;
            nextBtn.disabled = true;
            if (direction === 'first') prevBtn.disabled = true;
            return;
        }

        firstDocs[colName] = result.firstDoc;
        lastDocs[colName] = result.lastDoc;

        result.data.forEach(data => {
            tableBody.innerHTML += renderFunc(data);
        });

        prevBtn.disabled = (direction === 'first');
        nextBtn.disabled = (result.itemsCount < ITEMS_PER_PAGE);

    } catch (error) {
        console.error('Load data error:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-red-500 text-sm">
            <i class="fa-solid fa-circle-xmark mr-1"></i>Error: ${error.message}
        </td></tr>`;
    }
}

// ==========================================
// 4. FUNGSI RENDER BARIS TABEL
// ==========================================
function renderProduk(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
            <img src="${data.foto || 'https://placehold.co/48x48/e2e8f0/94a3b8?text=?'}"
                class="img-thumb" alt="${data.nama}">
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${data.nama}</td>
        <td class="px-4 py-3 text-slate-600">Rp ${parseInt(data.harga).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3 text-slate-600 text-xs">${data.wa}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'produk')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('products', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderBerita(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
            <img src="${data.foto || 'https://placehold.co/48x48/e2e8f0/94a3b8?text=?'}"
                class="img-thumb" alt="${data.judul}">
        </td>
        <td class="px-4 py-3">
            <p class="font-medium text-slate-700">${data.judul}</p>
            <p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-user mr-1"></i>${data.penulis || 'Admin'}</p>
        </td>
        <td class="px-4 py-3 text-slate-500 text-xs">${data.tanggal}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'berita')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('news', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderKesenian(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3 font-medium text-slate-700">${data.nama}</td>
        <td class="px-4 py-3">
            <a href="${data.link}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                <i class="fa-brands fa-youtube text-red-500"></i> Tonton
            </a>
        </td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'kesenian')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('galleries', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderKelompok(data) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    const preview = data.deskripsi.length > 60 ? data.deskripsi.substring(0, 60) + '...' : data.deskripsi;
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3 font-medium text-slate-700">${data.nama}</td>
        <td class="px-4 py-3 text-slate-500 text-sm">${preview}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'kelompok')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('groups', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

// ==========================================
// 5. DELETE & EDIT (EXPOSED KE WINDOW)
// ==========================================

window.deleteRowItem = async (colName, id) => {
    if (!confirm('Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.')) return;

    try {
        await removeItem(colName, id);
        // eslint-disable-next-line no-undef
        showToast('Data berhasil dihapus.', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error('Delete error:', error);
        // eslint-disable-next-line no-undef
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
};

window.prepareEdit = (id, dataStr, type) => {
    const data = JSON.parse(decodeURIComponent(dataStr));

    if (type === 'produk') {
        document.getElementById('idProduk').value = id;
        document.getElementById('prodNama').value = data.nama;
        document.getElementById('prodHarga').value = data.harga;
        document.getElementById('prodWA').value = data.wa;
        document.getElementById('infoFotoProd').classList.remove('hidden');
        document.getElementById('titleProduk').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Produk';
        document.getElementById('btnSaveProd').innerHTML = '<i class="fa-solid fa-pen"></i> Update Produk';
        document.getElementById('btnCancelProd').classList.remove('hidden');
        document.getElementById('formProduk').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'berita') {
        document.getElementById('idBerita').value = id;
        document.getElementById('newsJudul').value = data.judul;
        document.getElementById('newsPenulis').value = data.penulis || '';
        document.getElementById('infoFotoNews').classList.remove('hidden');
        // eslint-disable-next-line no-undef
        tinymce.get('newsIsi').setContent(data.isi);
        document.getElementById('titleBerita').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Berita';
        document.getElementById('btnSaveNews').innerHTML = '<i class="fa-solid fa-pen"></i> Update Berita';
        document.getElementById('btnCancelNews').classList.remove('hidden');
        document.getElementById('formBerita').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'kesenian') {
        document.getElementById('idKesenian').value = id;
        document.getElementById('artsNama').value = data.nama;
        document.getElementById('artsLink').value = data.link;
        document.getElementById('titleKesenian').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Kesenian';
        document.getElementById('btnSaveArts').innerHTML = '<i class="fa-solid fa-pen"></i> Update Kesenian';
        document.getElementById('btnCancelArts')?.classList.remove('hidden');
        document.getElementById('formKesenian').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'kelompok') {
        document.getElementById('idKelompok').value = id;
        document.getElementById('groupNama').value = data.nama;
        document.getElementById('groupDesc').value = data.deskripsi;
        document.getElementById('titleKelompok').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Kelompok';
        document.getElementById('btnSaveGroup').innerHTML = '<i class="fa-solid fa-pen"></i> Update Kelompok';
        document.getElementById('btnCancelGroup')?.classList.remove('hidden');
        document.getElementById('formKelompok').scrollIntoView({ behavior: 'smooth' });
    }
};

function resetForm() { location.reload(); }

['btnCancelProd', 'btnCancelNews', 'btnCancelArts', 'btnCancelGroup'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', resetForm);
});

// ==========================================
// 6. FORM SUBMIT (CREATE & UPDATE)
// ==========================================

function setButtonLoading(btn, isLoading, defaultHTML) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
        ? '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...'
        : defaultHTML;
}

// --- PRODUK ---
document.getElementById('formProduk').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idProduk').value;
    const btn = document.getElementById('btnSaveProd');
    setButtonLoading(btn, true, '<i class="fa-solid fa-save"></i> Simpan Produk');

    try {
        const fileInput = document.getElementById('prodFoto').files[0];
        const fotoUrl = fileInput ? await uploadToCloudinary(fileInput) : null;

        const payload = {
            nama: document.getElementById('prodNama').value,
            harga: document.getElementById('prodHarga').value,
            wa: document.getElementById('prodWA').value,
        };
        if (fotoUrl) payload.foto = fotoUrl;

        if (id) {
            await updateItem('products', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Produk berhasil diupdate!', 'success');
        } else {
            if (!fileInput) throw new Error('Foto wajib diupload untuk produk baru!');
            await createItem('products', payload);
            // eslint-disable-next-line no-undef
            showToast('Produk baru berhasil disimpan!', 'success');
        }
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-undef
        showToast(err.message, 'error');
        setButtonLoading(btn, false, '<i class="fa-solid fa-save"></i> Simpan Produk');
    }
});

// --- BERITA ---
document.getElementById('formBerita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idBerita').value;
    const btn = document.getElementById('btnSaveNews');
    // eslint-disable-next-line no-undef
    const content = tinymce.get('newsIsi').getContent();

    // eslint-disable-next-line no-undef
    if (tinymce.get('newsIsi').getContent({ format: 'text' }).trim().length === 0) {
        // eslint-disable-next-line no-undef
        showToast('Isi berita tidak boleh kosong!', 'warning');
        return;
    }

    setButtonLoading(btn, true, '<i class="fa-solid fa-save"></i> Simpan Berita');

    try {
        const fileInput = document.getElementById('newsFoto').files[0];
        const fotoUrl = fileInput ? await uploadToCloudinary(fileInput) : null;

        const payload = {
            judul: document.getElementById('newsJudul').value,
            penulis: document.getElementById('newsPenulis').value,
            isi: content,
        };
        if (fotoUrl) payload.foto = fotoUrl;

        if (id) {
            await updateItem('news', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Berita berhasil diupdate!', 'success');
        } else {
            if (!fileInput) throw new Error('Foto utama wajib diupload!');
            payload.tanggal = new Date().toLocaleDateString('id-ID');
            await createItem('news', payload);
            // eslint-disable-next-line no-undef
            showToast('Berita berhasil diterbitkan!', 'success');
        }
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-undef
        showToast(err.message, 'error');
        setButtonLoading(btn, false, '<i class="fa-solid fa-save"></i> Simpan Berita');
    }
});

// --- KESENIAN ---
document.getElementById('formKesenian').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idKesenian').value;
    const payload = {
        nama: document.getElementById('artsNama').value,
        link: document.getElementById('artsLink').value,
    };

    if (id) {
        await updateItem('galleries', id, payload);
    } else {
        await createItem('galleries', payload);
    }
    // eslint-disable-next-line no-undef
    showToast('Data kesenian berhasil disimpan!', 'success');
    setTimeout(() => location.reload(), 1500);
});

// --- KELOMPOK ---
document.getElementById('formKelompok').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idKelompok').value;
    const payload = {
        nama: document.getElementById('groupNama').value,
        deskripsi: document.getElementById('groupDesc').value,
    };

    if (id) {
        await updateItem('groups', id, payload);
    } else {
        await createItem('groups', payload);
    }
    // eslint-disable-next-line no-undef
    showToast('Data kelompok berhasil disimpan!', 'success');
    setTimeout(() => location.reload(), 1500);
});

// ==========================================
// 7. PAGINATION BUTTONS
// ==========================================
document.getElementById('nextProduk').onclick = () => loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk', 'next');
document.getElementById('prevProduk').onclick = () => loadData('products', 'tabelProdukBody', renderProduk, 'nextProduk', 'prevProduk', 'prev');
document.getElementById('nextBerita').onclick = () => loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'next');
document.getElementById('prevBerita').onclick = () => loadData('news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'prev');
document.getElementById('nextKesenian').onclick = () => loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian', 'next');
document.getElementById('prevKesenian').onclick = () => loadData('galleries', 'tabelKesenianBody', renderKesenian, 'nextKesenian', 'prevKesenian', 'prev');
document.getElementById('nextKelompok').onclick = () => loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok', 'next');
document.getElementById('prevKelompok').onclick = () => loadData('groups', 'tabelKelompokBody', renderKelompok, 'nextKelompok', 'prevKelompok', 'prev');