import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';

export default function MyBorrowedBooks() {
  const { currentUser } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'books'),
      where('borrowerId', '==', currentUser.uid),
      where('status', '==', 'sedang dipinjam')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBorrowedBooks(booksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Layout>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0 }}>Buku Pinjamanku</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
          Daftar buku yang sedang kamu pinjam dari teman-teman komunitas.
        </p>
      </div>

      {borrowedBooks.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--glass-card)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-dark)' }}>Belum Ada Pinjaman 🤷‍♂️</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Kamu sedang tidak meminjam buku apa pun saat ini.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {borrowedBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              isOwner={false} 
            />
          ))}
        </div>
      )}
    </Layout>
  );
}