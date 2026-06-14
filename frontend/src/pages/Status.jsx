import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Status = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  const fetchLogs = async (page, search) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/logs?page=${page}&limit=15&search=${encodeURIComponent(search)}`);
      setLogs(data.logs);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalLogs(data.totalLogs);
    } catch (err) {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleClearLogs = () => {
    setConfirmConfig({
      message: 'Are you sure you want to permanently delete all email logs?',
      icon: '🗑️',
      btnText: 'Clear Logs',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/logs/clear`);
          fetchLogs(1, searchTerm);
          toast.success('All logs cleared successfully');
        } catch (err) {
          toast.error('Failed to clear logs');
        }
      }
    });
  };

  return (
    <div className="page-card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {confirmConfig && (
        <ConfirmModal 
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          icon={confirmConfig.icon}
          btnText={confirmConfig.btnText}
          isDestructive={confirmConfig.isDestructive}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-title">Email Status & Logs</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Monitor automated email dispatch history, successes, and failures.</p>
        </div>
        <div>
          <button className="btn-logout" style={{ width: 'auto', marginTop: 0 }} onClick={handleClearLogs}>
            Clear History
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 Search by company name or email..." 
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="placeholder-content">
          <p>{searchTerm ? 'No logs found matching your search.' : 'No automated emails have been sent yet. Check back later.'}</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Read Receipt</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ color: '#94a3b8' }}>{new Date(log.sentAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 500, color: '#f8fafc' }}>{log.companyName}</td>
                    <td>{log.companyEmail || '-'}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: log.type === 'First Time' ? '#e0e7ff' : '#fce7f3', 
                        color: log.type === 'First Time' ? '#3730a3' : '#9d174d', 
                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {log.type}
                      </span>
                    </td>
                    <td>
                      {log.status === 'Success' ? (
                        <span style={{ backgroundColor: '#bbf7d0', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Success</span>
                      ) : log.status === 'Pending' ? (
                        <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Pending</span>
                      ) : (
                        <span style={{ backgroundColor: '#fecaca', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Failed</span>
                      )}
                    </td>
                    <td>
                      {log.opened ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }} title={`Opened at ${new Date(log.openedAt).toLocaleString()}`}>
                          ✅ Opened
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unread</span>
                      )}
                    </td>
                    <td style={{ color: log.status === 'Failed' ? '#ef4444' : '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.error || 'Delivered'}>
                      {log.error || 'Delivered'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing page {currentPage} of {totalPages} ({totalLogs} total logs)
              </div>
              <div className="pagination-controls">
                <button 
                  className="btn-page" 
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn-page" 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Status;
