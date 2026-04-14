/**
 * firebase-service.js
 * =========================================================
 * Service layer agnostik UI untuk operasi CRUD Firebase.
 * Membantu memisahkan manipulasi DOM dengan urusan Data.
 * =========================================================
 */

import { db, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, endBefore, limitToLast } from '../firebase-config.js';

/**
 * Mengambil seluruh data dari koleksi tertentu yang diurutkan berdasar createdAt.
 * (Digunakan oleh Public View / main-dynamic.js)
 */
export async function fetchAllByDateDesc(colName) {
    const q = query(collection(db, colName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = [];
    if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            data.id = docSnap.id;
            results.push(data);
        });
    }
    return results;
}

/**
 * Mengambil data dengan Pagination.
 * (Digunakan oleh Admin Dashboard)
 * 
 * @param {string} colName 
 * @param {number} itemsPerPage 
 * @param {'first'|'next'|'prev'} direction 
 * @param {object} lastDocsRef Referensi doc terakhir
 * @param {object} firstDocsRef Referensi doc pertama
 * @returns {object} { data, isFirst, isLast, newFirstDoc, newLastDoc }
 */
export async function getPaginatedData(colName, itemsPerPage, direction, lastDocsRef, firstDocsRef) {
    const colRef = collection(db, colName);
    let q;

    if (direction === 'next' && lastDocsRef) {
        q = query(colRef, orderBy('createdAt', 'desc'), startAfter(lastDocsRef), limit(itemsPerPage));
    } else if (direction === 'prev' && firstDocsRef) {
        q = query(colRef, orderBy('createdAt', 'desc'), endBefore(firstDocsRef), limitToLast(itemsPerPage));
    } else {
        q = query(colRef, orderBy('createdAt', 'desc'), limit(itemsPerPage));
    }

    const snapshot = await getDocs(q);
    const results = [];
    
    if (snapshot.empty) return { data: [], empty: true };

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.id = docSnap.id;
        results.push(data);
    });

    return {
        data: results,
        empty: false,
        firstDoc: snapshot.docs[0],
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        itemsCount: snapshot.docs.length
    };
}

/**
 * Membuat data baru (Create)
 */
export async function createItem(colName, payload) {
    payload.createdAt = new Date();
    payload.updatedAt = new Date();
    return await addDoc(collection(db, colName), payload);
}

/**
 * Mengupdate data (Update)
 */
export async function updateItem(colName, id, payload) {
    payload.updatedAt = new Date();
    return await updateDoc(doc(db, colName, id), payload);
}

/**
 * Menghapus data (Delete)
 */
export async function removeItem(colName, id) {
    return await deleteDoc(doc(db, colName, id));
}
