import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot } from "firebase/firestore";

export default function ExploreBooks() {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  
  // State untuk menyimpan teks pencarian
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Ambil semua buku secara real-time dari database
    const unsubscribe = onSnapshot(collection(db, 'books'), (snapshot) => {
      const allBooks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      // Saring agar buku milik Anda sendiri tidak muncul di halaman Jelajah
      const othersBooks = allBooks.filter(book => book.ownerId !== currentUser?.uid);
      setBooks(othersBooks);
    });
    return unsubscribe;
  }, [currentUser]);

  // Logika Pencarian Cerdas (Saring berdasarkan Judul ATAU Penulis)
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Kotak Pencarian Glassmorphism */}
      <div style={{
        marginBottom: '35px',
        background: 'var(--glass-card)',
        padding: '20px 25px',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.03)'
      }}>
        <span style={{ fontSize: '1.3rem' }}>🔍</span>
        <input
          type="text"
          placeholder="Cari judul buku atau nama penulis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', margin: 0 }} // Desainnya otomatis mengikuti main.css dan Dark Mode!
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Jelajah Buku</h2>
        <span style={{ background: 'var(--forest-green)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
          {filteredBooks.length} Buku
        </span>
      </div>

      {/* Grid Buku / Pesan Kosong */}
      {filteredBooks.length > 0 ? (
        <div className="book-grid">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} isOwner={false} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px', background: 'var(--glass-card)', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--text-dark)' }}>Oops! Buku tidak ditemukan 🥲</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Coba gunakan kata kunci lain untuk mencari buku impianmu.</p>
        </div>
      )}
    </Layout>
  );
}