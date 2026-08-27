import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, arrayRemove, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function ChatRoom() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [bookData, setBookData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    const fetchChatAndBook = async () => {
      const chatSnap = await getDoc(doc(db, 'chats', chatId));
      if (chatSnap.exists()) {
        const info = chatSnap.data();
        setChatInfo(info);
        
        if (info.unreadBy && info.unreadBy.includes(currentUser.uid)) {
          await updateDoc(doc(db, 'chats', chatId), {
            unreadBy: arrayRemove(currentUser.uid)
          });
        }

        const unsubBook = onSnapshot(doc(db, 'books', info.bookId), (bookSnap) => {
          if(bookSnap.exists()) setBookData(bookSnap.data());
        });
        return () => unsubBook();
      } else {
        navigate('/dashboard/inbox');
      }
    };
    fetchChatAndBook();

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, currentUser.uid, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const targetUserId = chatInfo.users.find(id => id !== currentUser.uid);

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Teman',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        unreadBy: [targetUserId]
      });

      setNewMessage('');
    } catch (error) {
      console.error("Gagal mengirim pesan:", error);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if(window.confirm("Hapus pesan ini?")) {
      await deleteDoc(doc(db, 'chats', chatId, 'messages', msgId));
    }
  };

  const handleDeleteChat = async () => {
    if(window.confirm("Yakin ingin menghapus seluruh obrolan ini?\n\nSetelah dihapus, peminjam dapat mengantre ulang untuk buku ini.")) {
      try {
        const msgsRef = collection(db, 'chats', chatId, 'messages');
        const msgsSnap = await getDocs(msgsRef);
        msgsSnap.forEach(async (messageDoc) => {
          await deleteDoc(messageDoc.ref);
        });
        await deleteDoc(doc(db, 'chats', chatId));
        navigate('/dashboard/inbox');
      } catch (error) {
        console.error("Gagal menghapus obrolan:", error);
      }
    }
  };

  const handleApprove = async () => {
    if (!chatInfo || !bookData) return;
    await updateDoc(doc(db, 'books', chatInfo.bookId), {
      status: 'sedang dipinjam',
      borrowerId: chatInfo.borrowerId,
      borrowerName: chatInfo.borrowerName
    });
    
    const msg = `🎉 SELAMAT! Permintaan pinjam disetujui oleh pemilik.`;
    await addDoc(collection(db, 'chats', chatId, 'messages'), { text: msg, senderId: 'system', senderName: '🤖 Sistem', createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: msg, lastMessageTime: serverTimestamp(), unreadBy: [chatInfo.borrowerId] });
  };

  const handleReject = async () => {
    const msg = `Maaf, pemilik belum bisa meminjamkan buku ini saat ini. 🙏\n(Silakan hapus obrolan ini jika ingin mencoba mengantre kembali nanti)`;
    await addDoc(collection(db, 'chats', chatId, 'messages'), { text: msg, senderId: 'system', senderName: '🤖 Sistem', createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: msg, lastMessageTime: serverTimestamp(), unreadBy: [chatInfo.borrowerId] });
  };

  // FITUR KEMBALIKAN (ACC)
  const handleConfirmReturn = async () => {
    if (!chatInfo || !bookData) return;
    await updateDoc(doc(db, 'books', chatInfo.bookId), {
      status: 'tersedia',
      borrowerId: null,
      borrowerName: null
    });
    
    const msg = `✅ KONFIRMASI: Buku telah dikembalikan dengan sukses. Terima kasih!`;
    await addDoc(collection(db, 'chats', chatId, 'messages'), { text: msg, senderId: 'system', senderName: '🤖 Sistem', createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: msg, lastMessageTime: serverTimestamp(), unreadBy: [chatInfo.borrowerId] });
  };

  // FITUR KEMBALIKAN (TOLAK)
  const handleDeclineReturn = async () => {
    const msg = `❌ KONFIRMASI: Pemilik menyatakan buku belum diterima. Silakan pastikan kembali fisiknya ya.`;
    await addDoc(collection(db, 'chats', chatId, 'messages'), { text: msg, senderId: 'system', senderName: '🤖 Sistem', createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: msg, lastMessageTime: serverTimestamp(), unreadBy: [chatInfo.borrowerId] });
  };

  const isOwner = chatInfo?.ownerId === currentUser.uid;
  const isBookAvailable = bookData?.status === 'tersedia';
  const isBorrowedByThisChat = bookData?.status === 'sedang dipinjam' && bookData?.borrowerId === chatInfo?.borrowerId;
  const hasMessages = messages.length > 0;

  return (
    <Layout>
      <div style={{ background: 'var(--glass-card)', borderRadius: '20px', border: '1px solid var(--glass-border)', height: 'calc(100dvh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-dark)' }}>←</button>
            <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Diskusi: {chatInfo?.bookTitle || 'Memuat...'}</h3>
          </div>
          
          <button onClick={handleDeleteChat} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} title="Hapus Seluruh Obrolan">
            🗑️
          </button>
        </div>

        {/* PANEL KONTROL PEMILIK */}
        {isOwner && hasMessages && (
          <div style={{ padding: '15px', background: isBorrowedByThisChat ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)', borderBottom: '1px solid var(--glass-border)', textAlign: 'center' }}>
            
            {isBookAvailable ? (
              // SKENARIO 1: Antre Pinjam
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-dark)' }}>Tindak lanjuti antrean dari <strong>{chatInfo?.borrowerName}</strong>:</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={handleApprove} className="main-action" style={{ padding: '8px 20px' }}>✅ ACC Pinjam</button>
                  <button onClick={handleReject} className="secondary-action" style={{ padding: '8px 20px', borderColor: '#FF5252', color: '#FF5252' }}>❌ Tolak</button>
                </div>
              </div>
            ) : isBorrowedByThisChat ? (
              // SKENARIO 2: Minta Dikembalikan
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-dark)' }}><strong>{chatInfo?.borrowerName}</strong> ingin mengembalikan buku ini. Sudah terima?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={handleConfirmReturn} className="main-action" style={{ padding: '8px 20px', background: '#FF9800', border: 'none' }}>✅ Sudah Diterima</button>
                  <button onClick={handleDeclineReturn} className="secondary-action" style={{ padding: '8px 20px', borderColor: '#FF5252', color: '#FF5252' }}>❌ Belum</button>
                </div>
              </div>
            ) : (
              // SKENARIO 3: Dipinjam orang lain
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#FF5252', fontWeight: 'bold' }}>Buku ini sedang dipinjam oleh orang lain.</p>
            )}
          </div>
        )}

        {/* AREA PESAN */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            const isSystem = msg.senderId === 'system';

            if (isSystem) {
              return <div key={msg.id} style={{ textAlign: 'center', margin: '10px 0', fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 'bold', background: 'rgba(0, 0, 0, 0.05)', padding: '10px', borderRadius: '10px' }}>{msg.text}</div>;
            }

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{
                  background: isMe ? 'var(--forest-green)' : 'rgba(0,0,0,0.05)', color: isMe ? 'white' : 'var(--text-dark)', padding: '10px 15px',
                  borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0', position: 'relative'
                }}>
                  {!isMe && <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px', opacity: 0.7 }}>{msg.senderName}</div>}
                  <div style={{ lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                </div>
                
                {isMe && (
                  <button onClick={() => handleDeleteMessage(msg.id)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#FF5252', fontSize: '0.75rem', marginTop: '3px', cursor: 'pointer' }}>
                    Hapus
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* KOTAK KETIK */}
        <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ketik pesan..." style={{ flex: 1, margin: 0, borderRadius: '12px' }} />
          <button type="submit" className="main-action" style={{ width: 'auto', padding: '0 25px', borderRadius: '12px' }}>Kirim</button>
        </form>
      </div>
    </Layout>
  );
}