import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Template = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Modals State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', subject: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', subject: '', body: '' });
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/template`);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // --- Handlers ---

  const handleAddSubmit = async () => {
    if (!addForm.name || !addForm.subject || !addForm.body) {
      return toast.error('All fields are required');
    }
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/template`, addForm);
      setShowAddModal(false);
      setAddForm({ name: '', subject: '', body: '' });
      fetchTemplates();
      toast.success('Template added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add template');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setEditForm({ name: template.name, subject: template.subject, body: template.body });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.name || !editForm.subject || !editForm.body) {
      return toast.error('All fields are required');
    }
    setSubmitting(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/template/${editingTemplate._id}`, editForm);
      setShowEditModal(false);
      fetchTemplates();
      toast.success('Template updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/template/${confirmDeleteId}`);
      setConfirmDeleteId(null);
      fetchTemplates();
      toast.success('Template deleted');
    } catch (err) {
      setConfirmDeleteId(null);
      toast.error('Failed to delete template');
    }
  };

  const openPreview = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <div className="page-card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Message Templates</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your predefined message templates.</p>
        </div>
        <div>
          <button className="btn-primary" style={{ width: 'auto', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={() => setShowAddModal(true)}>
            + Add Template
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="placeholder-content">
          <p>No templates found. Click "+ Add Template" to create one.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Subject</th>
                <th>Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template._id}>
                  <td style={{ fontWeight: 500, color: '#f8fafc' }}>{template.name}</td>
                  <td>{template.subject}</td>
                  <td>
                    <button className="action-btn" title="Preview Email" onClick={() => openPreview(template)}>
                      👁️
                    </button>
                  </td>
                  <td style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="action-btn" title="Edit" onClick={() => openEditModal(template)}>
                      ✏️
                    </button>
                    <button className="action-btn delete" title="Delete" onClick={() => initiateDelete(template._id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal 
          message="Are you sure you want to permanently delete this template? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
          icon="🗑️"
          btnText="Delete Permanently"
          isDestructive={true}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create New Template</h3>

            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Welcome Email" 
                value={addForm.name} 
                onChange={e => setAddForm({...addForm, name: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Welcome to our platform!" 
                value={addForm.subject} 
                onChange={e => setAddForm({...addForm, subject: e.target.value})} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Body *</label>
              <textarea 
                className="form-input" 
                style={{ height: '150px', resize: 'vertical' }}
                placeholder="Type your message body here..." 
                value={addForm.body} 
                onChange={e => setAddForm({...addForm, body: e.target.value})} 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-logout" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ marginTop: 0, width: 'auto', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} onClick={handleAddSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Template</h3>

            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.subject} 
                onChange={e => setEditForm({...editForm, subject: e.target.value})} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Body *</label>
              <textarea 
                className="form-input" 
                style={{ height: '150px', resize: 'vertical' }}
                value={editForm.body} 
                onChange={e => setEditForm({...editForm, body: e.target.value})} 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-logout" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ marginTop: 0, width: 'auto' }} onClick={handleEditSubmit} disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Email Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#e2e8f0', padding: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.875rem' }}>Email Preview</span>
              <button className="btn-logout" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginTop: 0 }} onClick={() => setShowPreviewModal(false)}>Close</button>
            </div>

            {/* Email UI Simulation */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <strong>Subject:</strong> <span style={{ color: '#0f172a' }}>{previewTemplate.subject}</span>
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>From:</strong> &lt;{import.meta.env.VITE_SENDER_EMAIL || 'hello@yourcompany.com'}&gt;
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: '2rem 1.5rem', minHeight: '200px' }}>
                <div style={{ 
                  color: '#334155', 
                  fontSize: '0.95rem', 
                  lineHeight: '1.6', 
                  whiteSpace: 'pre-wrap' 
                }}>
                  {previewTemplate.body}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Template;
