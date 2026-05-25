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
            if (data.order === undefined) {
                data.order = data.createdAt ? (data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt.getTime()) : Date.now();
            }
            results.push(data);
        });
    }
    // Sort in-memory to guarantee fallback behavior
    results.sort((a, b) => b.order - a.order);
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
        q = query(colRef, orderBy('order', 'desc'), startAfter(lastDocsRef), limit(itemsPerPage));
    } else if (direction === 'prev' && firstDocsRef) {
        q = query(colRef, orderBy('order', 'desc'), endBefore(firstDocsRef), limitToLast(itemsPerPage));
    } else {
        q = query(colRef, orderBy('order', 'desc'), limit(itemsPerPage));
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
    payload.order = Date.now();
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

/**
 * Memastikan semua dokumen di koleksi yang ditentukan memiliki field 'order'.
 * Migrasi berjalan otomatis saat login berhasil.
 */
export async function runOrderMigration() {
    const collections = ['village_profiles', 'tour_packages', 'accommodations', 'village_news'];
    for (const colName of collections) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                if (data.order === undefined) {
                    const createdAt = data.createdAt 
                        ? (data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt.getTime()) 
                        : Date.now();
                    await updateDoc(doc(db, colName, docSnap.id), {
                        order: createdAt
                    });
                    console.log(`Migrated ${colName} document ${docSnap.id} with order ${createdAt}`);
                }
            }
        }
    }
}

/**
 * Menukar order index dari dua item di Firestore
 */
export async function swapItemOrder(colName, itemAId, itemAOrder, itemBId, itemBOrder) {
    let newAOrder = itemBOrder;
    let newBOrder = itemAOrder;
    if (newAOrder === newBOrder) {
        newAOrder += 1;
    }
    await updateDoc(doc(db, colName, itemAId), { order: newAOrder, updatedAt: new Date() });
    await updateDoc(doc(db, colName, itemBId), { order: newBOrder, updatedAt: new Date() });
}
