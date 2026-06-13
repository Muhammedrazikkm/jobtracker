import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [stats, setStats] = useState({ totalUsers: 0, totalCompanies: 0, emailsSent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`);
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page-card">
      <h2 className="page-title">Welcome back, {userInfo?.email}!</h2>
      <p className="page-subtitle">Here is what's happening with your Job Tracker today.</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Companies</h3>
          <p className="stat-value">{loading ? '...' : stats.totalCompanies}</p>
        </div>
        <div className="stat-card">
          <h3>Total Emails Delivered</h3>
          <p className="stat-value" style={{ color: '#10b981' }}>{loading ? '...' : stats.emailsSent}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
