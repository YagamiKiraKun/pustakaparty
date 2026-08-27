import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-glass-card">
        {/* Tempat Logo Anda */}
        <img 
          src="/oibp.png" 
          alt="Logo Pustaka Party" 
          className="login-logo" 
          // Jika logo belum ada di folder public, gambar ini tidak akan muncul (tidak error)
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
        
        <h2>Pustaka Party</h2>
        <p>Aplikasi berbagi buku komunitas. Pinjam, baca, dan bagikan ilmu bersama bookmates.</p>
        
        <button onClick={handleGoogleLogin} className="google-login-btn">
          Lanjutkan dengan Google
        </button>
      </div>
    </div>
  );
}