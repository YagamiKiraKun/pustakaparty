import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <Layout>
      {/* Kita hapus warna '#fff' dan ganti dengan class "book-card" agar mengikuti tema */}
      <div className="book-card" style={{ padding: '40px', alignItems: 'flex-start', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px', marginTop: 0 }}>
          Selamat datang, {currentUser?.displayName?.split(' ')[0]}!
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Senang melihatmu di Pustaka Party. Mulai bagikan koleksi bukumu agar bisa dipinjam, atau jelajahi buku-buku menarik dari teman lainnya.
        </p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/my-books">
            <button className="main-action">Kelola Buku Saya</button>
          </Link>
          <Link to="/dashboard/explore">
            <button className="secondary-action">Jelajah Buku</button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}