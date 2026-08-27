import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// IKON LEBIH MEMBULAT & SOLID UNTUK MATCH DENGAN FONT POPPINS
const Icons = {
  Dashboard: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>,
  Books: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  Borrowed: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  Explore: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Inbox: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Profile: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Logout: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

export default function Layout({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0); 

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'), 
      where('unreadBy', 'array-contains', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size); 
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const menus = [
    { name: 'Dashboard', path: '/dashboard', icon: Icons.Dashboard, end: true },
    { name: 'Buku Saya', path: '/dashboard/my-books', icon: Icons.Books },
    { name: 'Pinjamanku', path: '/dashboard/borrowed', icon: Icons.Borrowed },
    { name: 'Jelajah', path: '/dashboard/explore', icon: Icons.Explore },
    { name: 'Pesan', path: '/dashboard/inbox', icon: Icons.Inbox, badge: unreadCount },
    { name: 'Profil', path: '/dashboard/profile', icon: Icons.Profile },
  ];

  return (
    <div className="dashboard-container">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <nav className="sidebar">
        <h2>Pustaka Party</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          {menus.map((menu) => (
            <NavLink key={menu.name} to={menu.path} end={menu.end} className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              {menu.icon} 
              <span style={{ flex: 1 }}>{menu.name}</span>
              {menu.badge > 0 && <span className="badge" style={{ position: 'relative', top: 0, right: 0 }}>{menu.badge}</span>}
            </NavLink>
          ))}
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          {Icons.Logout} Keluar
        </button>
      </nav>

      {/* --- KONTEN UTAMA --- */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>Halo, {currentUser?.displayName?.split(' ')[0] || 'Teman'}!</h1>
            <p>Jelajahi komunitas hari ini.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src={currentUser?.photoURL || 'https://via.placeholder.com/50'} 
              alt="Profile" 
              style={{ width: '45px', height: '45px', borderRadius: '15px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 10px rgba(6, 78, 59, 0.1)' }} 
            />
          </div>
        </header>
        
        {children}
      </main>

      {/* --- MOBILE NAV (Merapat ke bawah dengan lengkungan) --- */}
      <nav className="mobile-nav">
        {/* Saring menu untuk HP agar tidak terlalu padat */}
        {menus.filter(m => m.name !== 'Dashboard' && m.name !== 'Profil').map((menu) => (
          <NavLink key={menu.name} to={menu.path} end={menu.end} className={({isActive}) => isActive ? "mobile-link active" : "mobile-link"}>
            <div style={{ position: 'relative' }}>
              {menu.icon}
              {menu.badge > 0 && <span className="badge">{menu.badge}</span>}
            </div>
          </NavLink>
        ))}
        <NavLink to="/dashboard/profile" className={({isActive}) => isActive ? "mobile-link active" : "mobile-link"}>
          {Icons.Profile}
        </NavLink>
      </nav>
      
    </div>
  );
}