import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
// Tambahkan deleteDoc di impor ini
import { collection, query, where, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function MyBooks() {
  const { currentUser, whatsappNumber } = useAuth();
  const [myBooks, setMyBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', coverUrl: '', status: 'tersedia' });

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'books'), where('ownerId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyBooks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return unsubscribe;
  }, [currentUser]);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!whatsappNumber) {
      alert("Harap lengkapi nomor WhatsApp di profil Anda terlebih dahulu.");
      return;
    }
    await addDoc(collection(db, 'books'), { ...newBook, ownerId: currentUser.uid, ownerWhatsApp: whatsappNumber });
    setNewBook({ title: '', author: '', coverUrl: '', status: 'tersedia' });
  };

  const handleStatusChange = async (bookId, newStatus) => {
    await updateDoc(doc(db, 'books', bookId), { status: newStatus });
  };

  // Fungsi Baru: Simpan Edit
  const handleEditBook = async (bookId, updatedData) => {
    await updateDoc(doc(db, 'books', bookId), updatedData);
  };

  // Fungsi Baru: Hapus Buku
  const handleDeleteBook = async (bookId) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus buku ini dari koleksi?");
    if (confirmDelete) {
      await deleteDoc(doc(db, 'books', bookId));
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '40px', background: 'var(--glass-card)', padding: '25px', borderRadius: '25px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{marginTop: 0, marginBottom: '20px'}}>Tambah Koleksi Baru</h2>
        <form onSubmit={handleAddBook} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Judul Buku" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} required style={{flex: 1, minWidth: '200px'}} />
          <input type="text" placeholder="Penulis" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} required style={{flex: 1, minWidth: '150px'}} />
          <input type="url" placeholder="URL Link Cover Gambar (Opsional)" value={newBook.coverUrl} onChange={e => setNewBook({ ...newBook, coverUrl: e.target.value })} style={{flex: 2, minWidth: '250px'}} />
          <button type="submit" className="main-action" style={{whiteSpace: 'nowrap'}}>+ Tambah Buku</button>
        </form>
      </div>

      <h2 style={{ marginBottom: '20px' }}>Koleksi Saya</h2>
      <div className="book-grid">
        {myBooks.map(book => (
          <BookCard 
            key={book.id} 
            book={book} 
            onStatusChange={handleStatusChange} 
            onEdit={handleEditBook} 
            onDelete={handleDeleteBook}
            isOwner={true} 
          />
        ))}
      </div>
    </Layout>
  );
}