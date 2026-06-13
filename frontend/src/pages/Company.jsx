import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Company = () => {
  const [showModal, setShowModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  
  const [companies, setCompanies] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Modals Config
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', email: '', phone: '' });

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', address: '', email: '', phone: '' });

  const fetchCompanies = async (page, search) => {
    setFetchLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/company?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setCompanies(data.companies);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalCompanies(data.totalCompanies);
    } catch (err) {
      console.error('Failed to fetch companies', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCompanies(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleDeleteAll = () => {
    setConfirmConfig({
      message: 'Are you sure you want to delete ALL companies? This cannot be undone.',
      icon: '⚠️',
      btnText: 'Delete All',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/company/all`);
          fetchCompanies(1, searchTerm);
          toast.success('All companies deleted successfully');
        } catch (err) {
          toast.error('Failed to delete companies');
        }
      }
    });
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/company/sync`);
      toast.success(data.message);
      fetchCompanies(currentPage, searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync with Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (skipDuplicates = false) => {
    if (!sheetUrl) return setError('Please enter a URL');
    setError('');
    setSuccess('');
    setDuplicateError(false);
    setLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/company/upload`, {
        sheetUrl,
        skipDuplicates,
      });
      setSuccess(data.message);
      fetchCompanies(1, searchTerm); 
      setTimeout(() => {
        setShowModal(false);
        setSheetUrl('');
        setSuccess('');
      }, 3000);
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicateError(true);
        setError(err.response?.data?.message);
      } else {
        setError(err.response?.data?.message || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setAddForm({ name: '', address: '', email: '', phone: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.name) return toast.error('Company name is required');
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/company`, addForm);
      setShowAddModal(false);
      fetchCompanies(1, searchTerm);
      toast.success('Company added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      address: company.address.join(', '),
      email: company.email.join(', '),
      phone: company.phone.join(', ')
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/company/${editingCompany._id}`, editForm);
      setShowEditModal(false);
      fetchCompanies(currentPage, searchTerm);
      toast.success('Company updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = (id) => {
    setConfirmConfig({
      message: 'Are you sure you want to permanently delete this company?',
      icon: '🗑️',
      btnText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/company/${id}`);
          fetchCompanies(currentPage, searchTerm);
          toast.success('Company deleted');
        } catch (err) {
          toast.error('Failed to delete company');
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
          <h2 className="page-title">Company Management</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage all company details and settings here.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-logout" style={{ width: 'auto', marginTop: 0 }} onClick={handleDeleteAll}>
            Clear All
          </button>
          <button className="btn-primary" style={{ width: 'auto', marginTop: 0, background: 'linear-gradient(to right, #10b981, #059669)' }} onClick={handleSync} disabled={loading}>
            {loading ? 'Syncing...' : 'Refresh from Sheets'}
          </button>
          <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowModal(true)}>
            Upload Sheets
          </button>
          <button className="btn-primary" style={{ width: 'auto', marginTop: 0, background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={openAddModal}>
            + Add Company
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 Search by company name, email, phone, or address..." 
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ maxWidth: '400px' }}
        />
      </div>
      
      {fetchLoading && companies.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="placeholder-content">
          <p>{searchTerm ? 'No companies found matching your search.' : 'No companies found. Upload a sheet or add a company to get started.'}</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Email(s)</th>
                  <th>Phone(s)</th>
                  <th>Address(es)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Emails Sent</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody style={{ opacity: fetchLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {companies.map(company => (
                  <tr key={company._id}>
                    <td style={{ fontWeight: 500, color: '#f8fafc' }}>{company.name}</td>
                    <td>{company.email.join(', ') || '-'}</td>
                    <td>{company.phone.join(', ') || '-'}</td>
                    <td>{company.address.join(', ') || '-'}</td>
                    <td>
                      {company.first ? (
                        <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Queued</span>
                      ) : (
                        <span style={{ backgroundColor: '#bbf7d0', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Active Loop</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#38bdf8' }}>{company.emailCount || 0}</td>
                    <td style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="action-btn" title="Edit" onClick={() => openEditModal(company)}>
                        ✏️
                      </button>
                      <button className="action-btn delete" title="Delete" onClick={() => handleDeleteSingle(company._id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing page {currentPage} of {totalPages} ({totalCompanies} total companies)
              </div>
              <div className="pagination-controls">
                <button 
                  className="btn-page" 
                  disabled={currentPage === 1 || fetchLoading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn-page" 
                  disabled={currentPage === totalPages || fetchLoading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New Company</h3>

            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input type="text" className="form-input" placeholder="Acme Corp" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email(s) (comma separated)</label>
              <input type="text" className="form-input" placeholder="contact@acme.com, sales@acme.com" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone(s) (comma separated)</label>
              <input type="text" className="form-input" placeholder="1234567890, 0987654321" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Address(es) (comma separated)</label>
              <input type="text" className="form-input" placeholder="123 Main St, Suite 100" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-logout" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ marginTop: 0, width: 'auto', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={handleAddSubmit} disabled={loading}>
                {loading ? 'Adding...' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Company</h3>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email(s) (comma separated)</label>
              <input type="text" className="form-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone(s) (comma separated)</label>
              <input type="text" className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Address(es) (comma separated)</label>
              <input type="text" className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-logout" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ marginTop: 0, width: 'auto' }} onClick={handleEditSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Upload Google Sheet</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Paste a public Google Sheet URL. It must have columns for Name, Address, Email, and Phone.
            </p>

            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="success-message" style={{ marginBottom: '1rem' }}>{success}</div>}

            <input
              type="text"
              className="form-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              disabled={loading}
              style={{ marginBottom: '1.5rem' }}
            />

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem' }}>
                <div className="spinner"></div>
                <span style={{ color: '#38bdf8', fontWeight: 500 }}>Saving data...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-logout" onClick={() => { setShowModal(false); setError(''); setDuplicateError(false); }}>Cancel</button>
                {duplicateError ? (
                  <button className="btn-primary" style={{ marginTop: 0, width: 'auto', background: 'linear-gradient(to right, #10b981, #059669)' }} onClick={() => handleUpload(true)}>
                    Sync Existing Data
                  </button>
                ) : (
                  <button className="btn-primary" style={{ marginTop: 0, width: 'auto' }} onClick={() => handleUpload(false)}>
                    Upload
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
