import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Resume = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Modals State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/resume`);
      setResumes(data);
    } catch (err) {
      console.error('Failed to fetch resumes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = null;
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = null;
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAddSubmit = async () => {
    if (!title) return toast.error('Resume title is required');
    if (!file) return toast.error('Please select a PDF file');

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('resume', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAddModal(false);
      setTitle('');
      setFile(null);
      fetchResumes();
      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/resume/${confirmDeleteId}`);
      setConfirmDeleteId(null);
      fetchResumes();
      toast.success('Resume deleted');
    } catch (err) {
      setConfirmDeleteId(null);
      toast.error('Failed to delete resume');
    }
  };

  const handleDownload = async (filename, originalName) => {
    const toastId = toast.loading('Downloading...');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/uploads/resumes/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download complete', { id: toastId });
    } catch (err) {
      toast.error('Failed to download file', { id: toastId });
    }
  };

  const handlePreview = (filename) => {
    const fileUrl = `${import.meta.env.VITE_API_URL}/uploads/resumes/${filename}`;
    window.open(fileUrl, '_blank');
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (dateString) => {
    const tz = localStorage.getItem('systemTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      return new Date(dateString).toLocaleString("en-US", { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return new Date(dateString).toLocaleDateString();
    }
  };

  return (
    <div className="page-card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {confirmDeleteId && (
        <ConfirmModal 
          message="Are you sure you want to permanently delete this resume? The file will be lost forever."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
          icon="🗑️"
          btnText="Delete Permanently"
          isDestructive={true}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Resume Management</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Upload, preview, and manage all your resumes.</p>
        </div>
        <div>
          <button className="btn-primary" style={{ width: 'auto', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={() => setShowAddModal(true)}>
            + Upload Resume
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="placeholder-content">
          <p>No resumes found. Click "+ Upload Resume" to add one.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map(resume => (
                <tr key={resume._id}>
                  <td style={{ fontWeight: 500, color: '#f8fafc' }}>{resume.title}</td>
                  <td style={{ color: '#94a3b8' }}>{resume.originalName}</td>
                  <td style={{ color: '#94a3b8' }}>{formatSize(resume.size)}</td>
                  <td style={{ color: '#94a3b8' }}>{formatTime(resume.createdAt)}</td>
                  <td style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="action-btn" title="Preview" onClick={() => handlePreview(resume.filename)}>
                      👁️
                    </button>
                    <button className="action-btn" title="Download" onClick={() => handleDownload(resume.filename, resume.originalName)}>
                      ⬇️
                    </button>
                    <button className="action-btn delete" title="Delete" onClick={() => setConfirmDeleteId(resume._id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upload Resume</h3>

            <div className="form-group">
              <label className="form-label">Resume Title *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Software Engineer 2026" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Select PDF File *</label>
              <input 
                type="file" 
                accept="application/pdf"
                className="form-input" 
                onChange={handleFileChange} 
                style={{ padding: '0.5rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Max file size: 10MB. PDF only.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-logout" onClick={() => { setShowAddModal(false); setFile(null); setTitle(''); }}>Cancel</button>
              <button className="btn-primary" style={{ marginTop: 0, width: 'auto', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={handleAddSubmit} disabled={submitting}>
                {submitting ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Resume;
