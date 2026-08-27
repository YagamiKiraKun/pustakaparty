import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Inbox() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(collection(db, 'chats'), where('users', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Urutkan chat terbaru di atas
      chatList.sort((a, b) => (b.lastMessageTime?.toMillis() || 0) - (a.lastMessageTime?.toMillis() || 0));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: 'var(--theme-dark)' }}>Pesan Masuk</h2>
        <span style={{ background: 'var(--theme-dark)', color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
          {chats.length} Obrolan
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {chats.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Kotak Masuk Kosong 📭</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Belum ada obrolan. Mulai pinjam buku di halaman Jelajah!</p>
          </div>
        ) : (
          chats.map(chat => {
            const isUnread = chat.unreadBy && chat.unreadBy.includes(currentUser.uid);

            return (
              <div 
                key={chat.id} 
                onClick={() => navigate(`/dashboard/chat/${chat.id}`)}
                style={{
                  padding: '20px', 
                  background: isUnread ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.75)',
                  borderRadius: '20px', 
                  border: '1px solid var(--glass-border)', 
                  cursor: 'pointer', 
                  display: 'flex',
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '15px', /* Jarak mutlak antara teks dan tombol */
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(6, 78, 59, 0.05)'
                }}
              >
                {/* BAGIAN TEKS (Kiri) */}
                <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                  {isUnread && <span style={{ position: 'absolute', left: '-12px', top: '6px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span>}
                  
                  <h3 style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '1.05rem', 
                    color: 'var(--text-main)', 
                    fontWeight: isUnread ? '700' : '600',
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' /* Memotong judul panjang dengan titik-titik */
                  }}>
                    Buku: {chat.bookTitle}
                  </h3>
                  
                  <p style={{ 
                    margin: 0, 
                    color: isUnread ? 'var(--theme-dark)' : 'var(--text-muted)', 
                    fontSize: '0.85rem', 
                    fontWeight: isUnread ? '600' : '500',
                    lineHeight: '1.5',
                    /* Memotong pesan menjadi maksimal 2 baris saja */
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {chat.lastMessage || "Belum ada pesan..."}
                  </p>
                </div>

                {/* BAGIAN TOMBOL (Kanan) */}
                <button style={{ 
                  background: 'var(--theme-dark)', 
                  color: 'white', 
                  padding: '10px 18px', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap', /* Dilarang turun baris */
                  flexShrink: 0 /* Dilarang menyusut sekecil apapun */
                }}>
                  Buka Chat
                </button>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}