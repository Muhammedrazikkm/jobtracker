import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';
import axios from 'axios';

const Layout = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  React.useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchGlobalSettings = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/timezone`);
        if (data && data.value) {
          localStorage.setItem('systemTimezone', data.value);
        }
      } catch (err) {
        console.error('Failed to load global timezone');
      }
    };

    fetchGlobalSettings();
  }, [navigate, userInfo]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('userInfo');
    setShowLogoutConfirm(false);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  if (!userInfo) return null;

  return (
    <div className="layout-container">
      {showLogoutConfirm && (
        <ConfirmModal 
          message="Are you sure you want to log out of your account?"
          onConfirm={executeLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          icon="👋"
          btnText="Log Out"
          isDestructive={true}
        />
      )}

      {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>Job<span style={{ color: '#38bdf8' }}> Tracker</span></h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/company" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">🏢</span>
            Company
          </NavLink>
          <NavLink to="/template" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">📝</span>
            Templates
          </NavLink>
          <NavLink to="/resume" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">📄</span>
            Resume
          </NavLink>
          <NavLink to="/status" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">📊</span>
            Status Logs
          </NavLink>
          <NavLink to="/time-management" onClick={closeSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="icon">🕰️</span>
            Time Management
          </NavLink>
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="navbar">
          <div className="navbar-title">
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
          </div>
          <div className="navbar-user">
            <span className="user-email">{userInfo.email}</span>
            <button onClick={handleLogoutClick} className="btn-logout">Logout</button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
