import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const countries = [
  { name: 'India', timezone: 'Asia/Kolkata' },
  { name: 'United Arab Emirates (UAE)', timezone: 'Asia/Dubai' },
  { name: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { name: 'Qatar', timezone: 'Asia/Qatar' },
  { name: 'Oman', timezone: 'Asia/Muscat' },
  { name: 'Kuwait', timezone: 'Asia/Kuwait' },
  { name: 'Bahrain', timezone: 'Asia/Bahrain' }
];

const TimeManagement = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Automated Email State
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [emailConfig, setEmailConfig] = useState({
    templateId: '',
    resumeId: '',
    time: '',
    days: []
  });
  const [savingEmail, setSavingEmail] = useState(false);

  // Recurring Email State
  const [recurringConfig, setRecurringConfig] = useState({
    templateId: '',
    resumeId: '',
    intervalDays: 10,
    time: ''
  });
  const [savingRecurring, setSavingRecurring] = useState(false);

  // Quick Send State
  const [quickSendConfig, setQuickSendConfig] = useState({
    templateId: '',
    resumeId: '',
    time: '',
    emailTo: ''
  });
  const [sendingQuick, setSendingQuick] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchTimezoneSetting();
    fetchTemplatesAndResumes();
    fetchEmailSetting();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedCountry) {
      updateLiveTime(selectedCountry);
      interval = setInterval(() => updateLiveTime(selectedCountry), 1000);
    }
    return () => clearInterval(interval);
  }, [selectedCountry]);

  const fetchTimezoneSetting = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/timezone`);
      if (data && data.value) {
        setSelectedCountry(data.value);
      }
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  const fetchEmailSetting = async () => {
    try {
      const [firstRes, recRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings/automated_email_first`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/settings/automated_email_recurring`)
      ]);
      
      if (firstRes.data && firstRes.data.value) {
        setEmailConfig({
          templateId: firstRes.data.value.templateId || '',
          resumeId: firstRes.data.value.resumeId || '',
          time: firstRes.data.value.time || '',
          days: firstRes.data.value.days || []
        });
      }

      if (recRes.data && recRes.data.value) {
        setRecurringConfig({
          templateId: recRes.data.value.templateId || '',
          resumeId: recRes.data.value.resumeId || '',
          intervalDays: recRes.data.value.intervalDays || 10,
          time: recRes.data.value.time || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch email settings');
    }
  };

  const fetchTemplatesAndResumes = async () => {
    try {
      const [tplRes, rsmRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/template`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/resume`)
      ]);
      setTemplates(tplRes.data);
      setResumes(rsmRes.data);
    } catch (err) {
      toast.error('Failed to load templates or resumes');
    }
  };

  const updateLiveTime = (tz) => {
    try {
      const time = new Date().toLocaleString("en-US", { timeZone: tz, dateStyle: 'full', timeStyle: 'medium' });
      setCurrentTime(time);
    } catch (err) {
      setCurrentTime('Invalid Timezone');
    }
  };

  const handleSaveTimezone = async () => {
    if (!selectedCountry) return toast.error('Please select a country timezone');
    
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'timezone',
        value: selectedCountry
      });
      toast.success('System Timezone updated successfully');
      localStorage.setItem('systemTimezone', selectedCountry);
    } catch (err) {
      toast.error('Failed to save timezone setting');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setEmailConfig(prev => {
      const currentDays = Array.isArray(prev.days) ? prev.days : [];
      const days = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      return { ...prev, days };
    });
  };

  const handleSaveEmailConfig = async () => {
    if (!emailConfig.templateId) return toast.error('Please select a template');
    if (!emailConfig.time) return toast.error('Please select a time');
    if (emailConfig.days.length === 0) return toast.error('Please select at least one day');

    setSavingEmail(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'automated_email_first',
        value: emailConfig
      });
      toast.success('Automated Email Config saved successfully');
    } catch (err) {
      toast.error('Failed to save email config');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleResetEmailConfig = async () => {
    const emptyConfig = { templateId: '', resumeId: '', time: '', days: [] };
    setEmailConfig(emptyConfig);
    setSavingEmail(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'automated_email_first',
        value: emptyConfig
      });
      toast.success('Automation config reset and disabled');
    } catch (err) {
      toast.error('Failed to reset email config');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveRecurringConfig = async () => {
    if (!recurringConfig.templateId) return toast.error('Please select a template');
    if (!recurringConfig.time) return toast.error('Please select a time');
    if (!recurringConfig.intervalDays || recurringConfig.intervalDays <= 0) return toast.error('Please enter a valid interval');

    setSavingRecurring(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'automated_email_recurring',
        value: recurringConfig
      });
      toast.success('Recurring Email Config saved successfully');
    } catch (err) {
      toast.error('Failed to save recurring email config');
    } finally {
      setSavingRecurring(false);
    }
  };

  const handleResetRecurringConfig = async () => {
    const emptyConfig = { templateId: '', resumeId: '', intervalDays: 10, time: '' };
    setRecurringConfig(emptyConfig);
    setSavingRecurring(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'automated_email_recurring',
        value: emptyConfig
      });
      toast.success('Recurring config reset and disabled');
    } catch (err) {
      toast.error('Failed to reset recurring config');
    } finally {
      setSavingRecurring(false);
    }
  };

  const handleQuickSend = async () => {
    if (!quickSendConfig.templateId) return toast.error('Please select a template');
    if (!quickSendConfig.emailTo) return toast.error('Please enter an email address to send to');
    
    // Check past time if time is provided
    if (quickSendConfig.time) {
      const now = new Date();
      // Assume local time for validation
      const timeParts = quickSendConfig.time.split(':');
      const selectedDate = new Date();
      selectedDate.setHours(parseInt(timeParts[0], 10));
      selectedDate.setMinutes(parseInt(timeParts[1], 10));
      selectedDate.setSeconds(0);
      
      if (selectedDate < now) {
         return toast.error('Cannot schedule for a past time today.');
      }
    }

    setSendingQuick(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, {
        key: 'quick_send',
        value: {
          ...quickSendConfig,
          status: 'pending'
        }
      });
      toast.success(quickSendConfig.time ? `Quick Send scheduled for ${quickSendConfig.time}` : 'Quick Send initiated! Email will be sent in the background.');
      setQuickSendConfig({ templateId: '', resumeId: '', time: '', emailTo: '' });
    } catch (err) {
      toast.error('Failed to initiate quick send');
    } finally {
      setSendingQuick(false);
    }
  };

  return (
    <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Timezone Setup */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="page-title">Time Management</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Configure the global system timezone for all application records.</p>
        </div>

        <div style={{ maxWidth: '600px', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select System Country / Region</label>
            <select 
              className="form-input" 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="" disabled>-- Select a Country --</option>
              {countries.map(c => (
                <option key={c.timezone} value={c.timezone}>{c.name} ({c.timezone})</option>
              ))}
            </select>
          </div>

          {selectedCountry && currentTime && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0284c7', fontWeight: 600 }}>Current Time in selected region:</p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#0369a1', marginTop: '0.25rem', fontFamily: 'monospace' }}>{currentTime}</p>
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={handleSaveTimezone} 
            disabled={loading}
            style={{ width: '100%', marginTop: '2rem', background: 'linear-gradient(to right, #6366f1, #4f46e5)' }}
          >
            {loading ? 'Saving...' : 'Save Time Settings'}
          </button>
        </div>
      </div>

      {/* Automated Email Setup */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="page-title">Automated Email (First Time)</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Automatically send emails to new companies synced from Google Sheets.</p>
        </div>

        <div style={{ maxWidth: '600px', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Template *</label>
            <select 
              className="form-input" 
              value={emailConfig.templateId} 
              onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="" disabled>-- Choose Email Template --</option>
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name} (Subj: {t.subject})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Resume Attachment (Optional)</label>
            <select 
              className="form-input" 
              value={emailConfig.resumeId} 
              onChange={(e) => setEmailConfig({...emailConfig, resumeId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="">-- No Resume --</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>{r.title} ({r.originalName})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Time to Send *</label>
            <input 
              type="time" 
              className="form-input"
              value={emailConfig.time}
              onChange={(e) => setEmailConfig({...emailConfig, time: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Days to Send *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {daysOfWeek.map(day => (
                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', color: '#0f172a' }}>
                  <input 
                    type="checkbox" 
                    checked={Array.isArray(emailConfig.days) && emailConfig.days.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn-logout" 
              onClick={handleResetEmailConfig} 
              disabled={savingEmail}
              style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Automation
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSaveEmailConfig} 
              disabled={savingEmail}
              style={{ flex: 2, marginTop: 0, background: '#10b981' }}
            >
              {savingEmail ? 'Saving...' : 'Save Automation Config'}
            </button>
          </div>

        </div>
      </div>

      {/* Recurring Email Setup */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="page-title">Recurring Email (Follow-up)</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Automatically send follow-up emails to companies whose 'First Time' status is false, repeated every X days.</p>
        </div>

        <div style={{ maxWidth: '600px', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Template *</label>
            <select 
              className="form-input" 
              value={recurringConfig.templateId} 
              onChange={(e) => setRecurringConfig({...recurringConfig, templateId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="" disabled>-- Choose Email Template --</option>
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name} (Subj: {t.subject})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Resume Attachment (Optional)</label>
            <select 
              className="form-input" 
              value={recurringConfig.resumeId} 
              onChange={(e) => setRecurringConfig({...recurringConfig, resumeId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="">-- No Resume --</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>{r.title} ({r.originalName})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ color: '#0f172a' }}>Repeat Every (Days) *</label>
              <input 
                type="number" 
                min="1"
                className="form-input"
                value={recurringConfig.intervalDays}
                onChange={(e) => setRecurringConfig({...recurringConfig, intervalDays: e.target.value})}
                style={{ backgroundColor: '#fff', color: '#0f172a' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ color: '#0f172a' }}>Time to Send *</label>
              <input 
                type="time" 
                className="form-input"
                value={recurringConfig.time}
                onChange={(e) => setRecurringConfig({...recurringConfig, time: e.target.value})}
                style={{ backgroundColor: '#fff', color: '#0f172a' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn-logout" 
              onClick={handleResetRecurringConfig} 
              disabled={savingRecurring}
              style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset / Disable
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSaveRecurringConfig} 
              disabled={savingRecurring}
              style={{ flex: 2, marginTop: 0, background: '#10b981' }}
            >
              {savingRecurring ? 'Saving...' : 'Save Recurring Config'}
            </button>
          </div>

        </div>
      </div>

      {/* Quick Send Setup */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="page-title">Quick Send</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Instantly send or schedule a one-time email to a specific address.</p>
        </div>

        <div style={{ maxWidth: '600px', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Recipient Email *</label>
            <input 
              type="email" 
              placeholder="e.g. hr@company.com"
              className="form-input"
              value={quickSendConfig.emailTo}
              onChange={(e) => setQuickSendConfig({...quickSendConfig, emailTo: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Template *</label>
            <select 
              className="form-input" 
              value={quickSendConfig.templateId} 
              onChange={(e) => setQuickSendConfig({...quickSendConfig, templateId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="" disabled>-- Choose Email Template --</option>
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name} (Subj: {t.subject})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Select Resume Attachment (Optional)</label>
            <select 
              className="form-input" 
              value={quickSendConfig.resumeId} 
              onChange={(e) => setQuickSendConfig({...quickSendConfig, resumeId: e.target.value})}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            >
              <option value="">-- No Resume --</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>{r.title} ({r.originalName})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#0f172a' }}>Time to Send (Optional - Leave blank to send immediately)</label>
            <input 
              type="time" 
              className="form-input"
              value={quickSendConfig.time}
              onChange={(e) => {
                 setQuickSendConfig({...quickSendConfig, time: e.target.value});
              }}
              style={{ backgroundColor: '#fff', color: '#0f172a' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn-primary" 
              onClick={handleQuickSend} 
              disabled={sendingQuick}
              style={{ flex: 1, marginTop: 0, background: '#3b82f6' }}
            >
              {sendingQuick ? 'Processing...' : (quickSendConfig.time ? 'Schedule Quick Send' : 'Send Immediately')}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default TimeManagement;
