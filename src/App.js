import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyBooks from './pages/MyBooks';
import ExploreBooks from './pages/ExploreBooks';
import Profile from './pages/Profile';
// 1. IMPORT CHAT ROOM DI SINI
import ChatRoom from './pages/ChatRoom';
import Inbox from './pages/Inbox';
import { useAuth } from './contexts/AuthContext';
import MyBorrowedBooks from './pages/MyBorrowedBooks';
import './main.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard/my-books" element={<PrivateRoute><MyBooks /></PrivateRoute>} />
          <Route path="/dashboard/explore" element={<PrivateRoute><ExploreBooks /></PrivateRoute>} />
          <Route path="/dashboard/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          {/* 2. TAMBAHKAN JALUR CHAT ROOM DI SINI */}
          <Route path="/dashboard/chat/:chatId" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
          <Route path="/dashboard/inbox" element={<PrivateRoute><Inbox /></PrivateRoute>} />
          <Route path="/dashboard/borrowed" element={<PrivateRoute><MyBorrowedBooks /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;