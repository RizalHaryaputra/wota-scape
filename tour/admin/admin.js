import { auth, signOut, onAuthStateChanged } from '../js/firebase-config.js';
import { getPaginatedData, createItem, updateItem, removeItem, runOrderMigration, swapItemOrder } from '../js/services/firebase-service.js';

// ==========================================
// KONFIGURASI
// ==========================================
const CLOUD_NAME = 'dothvi6d9';
const UPLOAD_PRESET = 'kavviar-preset';
const ITEMS_PER_PAGE = 5;

// State pagination untuk setiap koleksi
let lastDocs = { village_profiles: null, tour_packages: null, accommodations: null, village_news: null };
let firstDocs = { village_profiles: null, tour_packages: null, accommodations: null, village_news: null };
let loadedData = { village_profiles: [], tour_packages: [], accommodations: [], village_news: [] };

// ==========================================
// INISIALISASI TINYMCE
// ==========================================
// eslint-disable-next-line no-undef
tinymce.init({
    selector: '#newsIsi',
    height: 320,
    menubar: false,
    skin: 'oxide-dark',
    content_css: 'dark',
    plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat | help',
    content_style: `
        body {
            font-family: 'Inter', Helvetica, Arial, sans-serif;
            font-size: 14px;
            background-color: #0d1a0f;
            color: #f0ece4;
            line-height: 1.7;
            padding: 8px 12px;
        }
        a { color: #6ab85e; }
        p { margin: 0 0 0.75em 0; }
    `,
    body_class: 'wota-editor',
});

// ==========================================
// 1. CEK AUTH & LOAD DATA AWAL
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        console.log('Login sebagai:', user.email);
        try {
            await runOrderMigration();
        } catch (err) {
            console.error('Gagal menjalankan migrasi order:', err);
        }
        loadData('village_profiles', 'tabelProfilBody', renderProfil, 'nextProfil', 'prevProfil');
        loadData('tour_packages', 'tabelPaketBody', renderPaket, 'nextPaket', 'prevPaket');
        loadData('accommodations', 'tabelPenginapanBody', renderPenginapan, 'nextPenginapan', 'prevPenginapan');
        loadData('village_news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita');
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

        loadedData[colName] = result.data;
        result.data.forEach((data, index) => {
            tableBody.innerHTML += renderFunc(data, index, result.data.length);
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
function renderOrderButtons(colName, index, totalItems) {
    const isFirst = (index === 0);
    const isLast = (index === totalItems - 1);
    
    return `
    <div class="flex items-center gap-1">
        <button onclick="moveItem('${colName}', ${index}, 'up')" ${isFirst ? 'disabled' : ''}
            class="btn-order-move"
            title="Pindahkan ke atas">
            <i class="fa-solid fa-arrow-up text-xs"></i>
        </button>
        <button onclick="moveItem('${colName}', ${index}, 'down')" ${isLast ? 'disabled' : ''}
            class="btn-order-move"
            title="Pindahkan ke bawah">
            <i class="fa-solid fa-arrow-down text-xs"></i>
        </button>
    </div>`;
}

function renderProfil(data, index, totalItems) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    const orderButtons = renderOrderButtons('village_profiles', index, totalItems);
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3 font-medium text-slate-700">${data.judul}</td>
        <td class="px-4 py-3">
            <a href="${data.link}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                <i class="fa-brands fa-youtube text-red-500"></i> Tonton
            </a>
        </td>
        <td class="px-4 py-3">${orderButtons}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'profil')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('village_profiles', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderPaket(data, index, totalItems) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    const orderButtons = renderOrderButtons('tour_packages', index, totalItems);
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
            <img src="${data.foto || 'https://placehold.co/48x48/e2e8f0/94a3b8?text=?'}"
                class="img-thumb" alt="${data.nama}">
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${data.nama}</td>
        <td class="px-4 py-3 text-slate-600">Rp ${parseInt(data.harga).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3 text-slate-600 text-xs">${data.fasilitas}</td>
        <td class="px-4 py-3">${orderButtons}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'paket')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('tour_packages', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderPenginapan(data, index, totalItems) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    const orderButtons = renderOrderButtons('accommodations', index, totalItems);
    return `
    <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
            <img src="${data.foto || 'https://placehold.co/48x48/e2e8f0/94a3b8?text=?'}"
                class="img-thumb" alt="${data.nama}">
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${data.nama}</td>
        <td class="px-4 py-3">
            <p class="text-slate-700 text-sm">${data.pemilik}</p>
            <p class="text-xs text-slate-500"><i class="fa-brands fa-whatsapp text-green-500 mr-1"></i>${data.wa}</p>
        </td>
        <td class="px-4 py-3 text-slate-600">Rp ${parseInt(data.harga).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3">${orderButtons}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'penginapan')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('accommodations', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

function renderBerita(data, index, totalItems) {
    const dataStr = encodeURIComponent(JSON.stringify(data));
    const orderButtons = renderOrderButtons('village_news', index, totalItems);
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
        <td class="px-4 py-3">${orderButtons}</td>
        <td class="px-4 py-3">
            <div class="flex gap-2">
                <button onclick="prepareEdit('${data.id}', '${dataStr}', 'berita')"
                    class="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen text-[10px]"></i> Edit
                </button>
                <button onclick="deleteRowItem('village_news', '${data.id}')"
                    class="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash text-[10px]"></i> Hapus
                </button>
            </div>
        </td>
    </tr>`;
}

// Event handler untuk pemindahan urutan
window.moveItem = async (colName, index, direction) => {
    const list = loadedData[colName];
    if (!list || list.length === 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const itemA = list[index];
    const itemB = list[targetIndex];

    // Gunakan toast loading
    // eslint-disable-next-line no-undef
    showToast('Memproses urutan baru...', 'warning');

    try {
        await swapItemOrder(colName, itemA.id, itemA.order, itemB.id, itemB.order);
        // eslint-disable-next-line no-undef
        showToast('Urutan berhasil diperbarui!', 'success');

        let tableId, renderFunc, nextBtnId, prevBtnId;
        if (colName === 'village_profiles') {
            tableId = 'tabelProfilBody'; renderFunc = renderProfil; nextBtnId = 'nextProfil'; prevBtnId = 'prevProfil';
        } else if (colName === 'tour_packages') {
            tableId = 'tabelPaketBody'; renderFunc = renderPaket; nextBtnId = 'nextPaket'; prevBtnId = 'prevPaket';
        } else if (colName === 'accommodations') {
            tableId = 'tabelPenginapanBody'; renderFunc = renderPenginapan; nextBtnId = 'nextPenginapan'; prevBtnId = 'prevPenginapan';
        } else if (colName === 'village_news') {
            tableId = 'tabelBeritaBody'; renderFunc = renderBerita; nextBtnId = 'nextBerita'; prevBtnId = 'prevBerita';
        }

        loadData(colName, tableId, renderFunc, nextBtnId, prevBtnId, 'first');
    } catch (error) {
        console.error('Error saat memindahkan item:', error);
        // eslint-disable-next-line no-undef
        showToast('Gagal mengubah urutan: ' + error.message, 'error');
    }
};

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

    if (type === 'profil') {
        document.getElementById('idProfil').value = id;
        document.getElementById('profJudul').value = data.judul;
        document.getElementById('profLink').value = data.link;
        document.getElementById('titleProfil').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Profil Video';
        document.getElementById('btnSaveProfil').innerHTML = '<i class="fa-solid fa-pen"></i> Update Video';
        document.getElementById('btnCancelProfil').classList.remove('hidden');
        document.getElementById('formProfil').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'paket') {
        document.getElementById('idPaket').value = id;
        document.getElementById('pktNama').value = data.nama;
        document.getElementById('pktHarga').value = data.harga;
        document.getElementById('pktFasilitas').value = data.fasilitas;
        document.getElementById('pktDesc').value = data.deskripsi;
        document.getElementById('infoFotoPkt').classList.remove('hidden');
        document.getElementById('titlePaket').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Paket Wisata';
        document.getElementById('btnSavePaket').innerHTML = '<i class="fa-solid fa-pen"></i> Update Paket';
        document.getElementById('btnCancelPaket').classList.remove('hidden');
        document.getElementById('formPaket').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'penginapan') {
        document.getElementById('idPenginapan').value = id;
        document.getElementById('inapNama').value = data.nama;
        document.getElementById('inapHarga').value = data.harga;
        document.getElementById('inapPemilik').value = data.pemilik;
        document.getElementById('inapWA').value = data.wa;
        document.getElementById('infoFotoInap').classList.remove('hidden');
        document.getElementById('titlePenginapan').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Penginapan';
        document.getElementById('btnSavePenginapan').innerHTML = '<i class="fa-solid fa-pen"></i> Update Penginapan';
        document.getElementById('btnCancelPenginapan')?.classList.remove('hidden');
        document.getElementById('formPenginapan').scrollIntoView({ behavior: 'smooth' });

    } else if (type === 'berita') {
        document.getElementById('idBerita').value = id;
        document.getElementById('newsJudul').value = data.judul;
        document.getElementById('newsPenulis').value = data.penulis || '';
        document.getElementById('infoFotoNews').classList.remove('hidden');
        // eslint-disable-next-line no-undef
        tinymce.get('newsIsi').setContent(data.isi);
        document.getElementById('titleBerita').innerHTML = '<i class="fa-solid fa-pen text-amber-600"></i> Edit Berita Desa';
        document.getElementById('btnSaveNews').innerHTML = '<i class="fa-solid fa-pen"></i> Update Berita';
        document.getElementById('btnCancelNews').classList.remove('hidden');
        document.getElementById('formBerita').scrollIntoView({ behavior: 'smooth' });
    }
};

function resetForm() { location.reload(); }

['btnCancelProfil', 'btnCancelPaket', 'btnCancelPenginapan', 'btnCancelNews'].forEach(btnId => {
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

// --- PROFIL DESA ---
document.getElementById('formProfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idProfil').value;
    const btn = document.getElementById('btnSaveProfil');
    setButtonLoading(btn, true, '<i class="fa-solid fa-save"></i> Simpan Video');

    try {
        const payload = {
            judul: document.getElementById('profJudul').value,
            link: document.getElementById('profLink').value,
        };

        if (id) {
            await updateItem('village_profiles', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Profil video berhasil diupdate!', 'success');
        } else {
            await createItem('village_profiles', payload);
            // eslint-disable-next-line no-undef
            showToast('Profil video baru berhasil disimpan!', 'success');
        }
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-undef
        showToast(err.message, 'error');
        setButtonLoading(btn, false, '<i class="fa-solid fa-save"></i> Simpan Video');
    }
});

// --- PAKET WISATA ---
document.getElementById('formPaket').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idPaket').value;
    const btn = document.getElementById('btnSavePaket');
    setButtonLoading(btn, true, '<i class="fa-solid fa-save"></i> Simpan Paket');

    try {
        const fileInput = document.getElementById('pktFoto').files[0];
        const fotoUrl = fileInput ? await uploadToCloudinary(fileInput) : null;

        const payload = {
            nama: document.getElementById('pktNama').value,
            harga: document.getElementById('pktHarga').value,
            fasilitas: document.getElementById('pktFasilitas').value,
            deskripsi: document.getElementById('pktDesc').value,
        };
        if (fotoUrl) payload.foto = fotoUrl;

        if (id) {
            await updateItem('tour_packages', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Paket wisata berhasil diupdate!', 'success');
        } else {
            if (!fileInput) throw new Error('Foto wajib diupload untuk paket wisata baru!');
            await createItem('tour_packages', payload);
            // eslint-disable-next-line no-undef
            showToast('Paket wisata baru berhasil disimpan!', 'success');
        }
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-undef
        showToast(err.message, 'error');
        setButtonLoading(btn, false, '<i class="fa-solid fa-save"></i> Simpan Paket');
    }
});

// --- PENGINAPAN ---
document.getElementById('formPenginapan').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('idPenginapan').value;
    const btn = document.getElementById('btnSavePenginapan');
    setButtonLoading(btn, true, '<i class="fa-solid fa-save"></i> Simpan Penginapan');

    try {
        const fileInput = document.getElementById('inapFoto').files[0];
        const fotoUrl = fileInput ? await uploadToCloudinary(fileInput) : null;

        const payload = {
            nama: document.getElementById('inapNama').value,
            harga: document.getElementById('inapHarga').value,
            pemilik: document.getElementById('inapPemilik').value,
            wa: document.getElementById('inapWA').value,
        };
        if (fotoUrl) payload.foto = fotoUrl;

        if (id) {
            await updateItem('accommodations', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Penginapan berhasil diupdate!', 'success');
        } else {
            if (!fileInput) throw new Error('Foto wajib diupload untuk penginapan baru!');
            await createItem('accommodations', payload);
            // eslint-disable-next-line no-undef
            showToast('Penginapan baru berhasil disimpan!', 'success');
        }
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-undef
        showToast(err.message, 'error');
        setButtonLoading(btn, false, '<i class="fa-solid fa-save"></i> Simpan Penginapan');
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
            await updateItem('village_news', id, payload);
            // eslint-disable-next-line no-undef
            showToast('Berita berhasil diupdate!', 'success');
        } else {
            if (!fileInput) throw new Error('Foto utama wajib diupload!');
            payload.tanggal = new Date().toLocaleDateString('id-ID');
            await createItem('village_news', payload);
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

// ==========================================
// 7. PAGINATION BUTTONS
// ==========================================
document.getElementById('nextProfil').onclick = () => loadData('village_profiles', 'tabelProfilBody', renderProfil, 'nextProfil', 'prevProfil', 'next');
document.getElementById('prevProfil').onclick = () => loadData('village_profiles', 'tabelProfilBody', renderProfil, 'nextProfil', 'prevProfil', 'prev');
document.getElementById('nextPaket').onclick = () => loadData('tour_packages', 'tabelPaketBody', renderPaket, 'nextPaket', 'prevPaket', 'next');
document.getElementById('prevPaket').onclick = () => loadData('tour_packages', 'tabelPaketBody', renderPaket, 'nextPaket', 'prevPaket', 'prev');
document.getElementById('nextPenginapan').onclick = () => loadData('accommodations', 'tabelPenginapanBody', renderPenginapan, 'nextPenginapan', 'prevPenginapan', 'next');
document.getElementById('prevPenginapan').onclick = () => loadData('accommodations', 'tabelPenginapanBody', renderPenginapan, 'nextPenginapan', 'prevPenginapan', 'prev');
document.getElementById('nextBerita').onclick = () => loadData('village_news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'next');
document.getElementById('prevBerita').onclick = () => loadData('village_news', 'tabelBeritaBody', renderBerita, 'nextBerita', 'prevBerita', 'prev');