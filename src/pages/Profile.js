import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from "firebase/firestore";

export default function Profile() {
  const { currentUser, whatsappNumber, setWhatsappNumber } = useAuth();
  const [newNumber, setNewNumber] = useState('');

  useEffect(() => {
    setNewNumber(whatsappNumber);
  }, [whatsappNumber]);

  const handleUpdateWhatsApp = async () => {
    if (!newNumber.startsWith('+62') || newNumber.length < 10) {
        alert('Harap gunakan format internasional lengkap (+62...).');
        return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    // Simpan ke database
    await setDoc(userDocRef, { displayName: currentUser.displayName, whatsappNumber: newNumber }, { merge: true });
    // Perbarui status lokal
    setWhatsappNumber(newNumber);
    alert('Nomor WhatsApp diperbarui.');
  };

  return (
    <Layout>
      {/* Container pembungkus agar posisinya di tengah layar area konten */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
        
        {/* Kartu Profil */}
        <div className="book-card" style={{ 
            width: '100%', 
            maxWidth: '450px', 
            alignItems: 'center', /* Memusatkan semua elemen di dalam kartu */
            textAlign: 'center',  /* Memusatkan teks */
            padding: '40px' 
        }}>
          
          <h2 style={{ margin: '0 0 30px 0' }}>Profil Saya</h2>
          
          {/* Foto Profil dengan bingkai tipis */}
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/120'}
            alt="Profile"
            style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                marginBottom: '15px', 
                objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.8)'
            }}
          />
          
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{currentUser?.displayName}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0' }}>{currentUser?.email}</p>
          
          {/* Bagian Input WhatsApp */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '30px' }}>
              <p style={{ fontWeight: '600', marginBottom: '10px' }}>Nomor WhatsApp (Wajib)</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Gunakan format negara (contoh: +62812...) agar orang lain bisa langsung menghubungi Anda.
              </p>
              
              <input
                  type="text"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  placeholder="+62812345678"
                  style={{ 
                      width: '100%', 
                      padding: '12px 15px', 
                      textAlign: 'center', /* Memusatkan teks saat diketik */
                      marginBottom: '15px', 
                      fontSize: '1.05rem',
                      letterSpacing: '1px'
                  }}
              />
              
              <button onClick={handleUpdateWhatsApp} className="main-action" style={{ width: '100%', padding: '15px' }}>
                  Simpan Nomor
              </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}