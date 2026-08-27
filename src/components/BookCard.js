import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookCard({ book, onStatusChange, onDelete, onEdit, isOwner }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    title: book.title, 
    author: book.author, 
    coverUrl: book.coverUrl || '' 
  });

  const coverImage = book.coverUrl || `https://via.placeholder.com/300x400/E2E8E4/043927?text=${encodeURIComponent(book.title)}`;

  const handleSaveEdit = () => {
    if(onEdit) {
      onEdit(book.id, editData);
      setIsEditing(false);
    }
  };

  const handleRequestAndChat = async () => {
    if (!currentUser) return;
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('bookId', '==', book.id), where('borrowerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      let chatId = null;
      const bookOwner = book.ownerId || book.userId || '';

      if (!querySnapshot.empty) {
        chatId = querySnapshot.docs[0].id;
      } else {
        const defaultMessage = `Halo, saya ingin antre meminjam buku "${book.title}". Apakah masih tersedia?`;
        const newChat = await addDoc(chatsRef, {
          bookId: book.id, bookTitle: book.title, borrowerId: currentUser.uid, borrowerName: currentUser.displayName || 'Peminjam',
          ownerId: bookOwner, users: [currentUser.uid, bookOwner], createdAt: serverTimestamp(),
          lastMessage: defaultMessage, lastMessageTime: serverTimestamp(), unreadBy: [bookOwner]
        });
        chatId = newChat.id;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: defaultMessage, senderId: currentUser.uid, senderName: currentUser.displayName || 'Peminjam', createdAt: serverTimestamp()
        });
      }
      navigate(`/dashboard/chat/${chatId}`);
    } catch (error) {
      console.error("Gagal membuat chat:", error);
    }
  };

  // FITUR KEMBALIKAN (SUDAH DIPERBAIKI ANTI-DIAM)
  const handleReturnAndChat = async () => {
    if (!currentUser) return;
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('bookId', '==', book.id), where('borrowerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      let chatId = null;
      const bookOwner = book.ownerId || book.userId || '';
      const returnMsg = `Halo, saya ingin mengembalikan buku "${book.title}". Tolong konfirmasi ya jika sudah diterima!`;
      
      if (!querySnapshot.empty) {
        // SKENARIO 1: Kalau obrolannya masih ada
        chatId = querySnapshot.docs[0].id;
        const chatData = querySnapshot.docs[0].data();
        
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: returnMsg, senderId: currentUser.uid, senderName: currentUser.displayName || 'Peminjam', createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: returnMsg, lastMessageTime: serverTimestamp(), unreadBy: [chatData.ownerId || bookOwner]
        });
      } else {
        // SKENARIO 2: Kalau obrolannya sudah keburu dihapus, KITA BIKIN BARU!
        const newChat = await addDoc(chatsRef, {
          bookId: book.id, bookTitle: book.title, borrowerId: currentUser.uid, borrowerName: currentUser.displayName || 'Peminjam',
          ownerId: bookOwner, users: [currentUser.uid, bookOwner], createdAt: serverTimestamp(),
          lastMessage: returnMsg, lastMessageTime: serverTimestamp(), unreadBy: [bookOwner]
        });
        chatId = newChat.id;
        
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: returnMsg, senderId: currentUser.uid, senderName: currentUser.displayName || 'Peminjam', createdAt: serverTimestamp()
        });
      }
      
      // Paksa pindah ke halaman chat
      navigate(`/dashboard/chat/${chatId}`);
      
    } catch (error) {
      console.error("Gagal proses kembalikan:", error);
      alert("Terjadi kesalahan sistem, silakan coba lagi.");
    }
  };

  // Mencegah kartu memudar jika kita yang pinjam
  const cardOpacity = (book.status === 'sedang dipinjam' && book.borrowerId !== currentUser?.uid) ? 0.7 : 1;

  return (
    <div className="book-card" style={{ opacity: cardOpacity }}>
      <img src={coverImage} alt={`Cover ${book.title}`} className="book-cover" />

      <div className="book-info">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Judul Buku" style={{ padding: '8px' }} />
            <input type="text" value={editData.author} onChange={e => setEditData({...editData, author: e.target.value})} placeholder="Penulis" style={{ padding: '8px' }} />
            <input type="url" value={editData.coverUrl} onChange={e => setEditData({...editData, coverUrl: e.target.value})} placeholder="URL Cover" style={{ padding: '8px' }} />
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
              <button onClick={handleSaveEdit} className="main-action" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}>Simpan</button>
              <button onClick={() => setIsEditing(false)} className="secondary-action" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}>Batal</button>
            </div>
          </div>
        ) : (
          <>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
          </>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '6px', backgroundColor: book.status === 'tersedia' ? '#4CAF50' : '#FF5252' }}></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ textTransform: 'capitalize', fontSize: '0.9rem', fontWeight: '500' }}>
                {book.status === 'tersedia' ? 'Tersedia' : 'Sedang Dipinjam'}
              </span>
              {book.status === 'sedang dipinjam' && book.borrowerName && (
                <span style={{ fontSize: '0.75rem', color: '#FF5252' }}>Oleh {book.borrowerName.split(' ')[0]}</span>
              )}
            </div>
          </div>

          {isOwner ? (
            <select value={book.status} onChange={(e) => onStatusChange(book.id, e.target.value)} style={{ padding: '6px 10px', width: 'auto', fontSize: '0.85rem' }}>
              <option value="tersedia">Tersedia</option>
              <option value="sedang dipinjam">Dipinjam</option>
            </select>
          ) : (
            book.status === 'tersedia' ? (
              <button onClick={handleRequestAndChat} className="main-action" style={{ padding: '8px 15px', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                Antre Pinjam
              </button>
            ) : book.borrowerId === currentUser?.uid ? (
              // TOMBOL KEMBALIKAN
              <button onClick={handleReturnAndChat} className="main-action" style={{ padding: '8px 15px', fontSize: '0.9rem', border: 'none', cursor: 'pointer', background: '#FF9800' }}>
                Kembalikan
              </button>
            ) : (
              <button className="secondary-action" disabled style={{ color: 'gray', padding: '8px 15px', fontSize: '0.9rem', border: 'none' }}>
                Dipinjam
              </button>
            )
          )}
        </div>

        {isOwner && !isEditing && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '15px' }}>
            <button onClick={() => setIsEditing(true)} className="edit-action" style={{flex: 1}}>Edit</button>
            <button onClick={() => onDelete(book.id)} className="delete-action" style={{flex: 1}}>Hapus</button>
          </div>
        )}
      </div>
    </div>
  );
}