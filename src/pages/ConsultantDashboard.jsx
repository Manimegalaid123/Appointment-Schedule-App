import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar, Clock, User, Mail, Phone, Check, X, Edit2, Bell, LogOut, Plus, Search,
  ChevronDown, AlertCircle, CheckCircle, XCircle, RefreshCw, Download, Settings, BarChart3, FileText
} from 'lucide-react';
import { appointmentAPI, businessAPI } from '../utils/api';
import './consultantDashboard.css';

const ConsultantDashboard = () => {
  const { consultantEmail } = useParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [consultantInfo, setConsultantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(0);

  // Fetch consultant info
  useEffect(() => {
    const fetchConsultantInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const email = consultantEmail ? decodeURIComponent(consultantEmail) : 'consultant@email.com';
        const response = await businessAPI.getByEmail(email);
        if (response.success && response.business) {
          setConsultantInfo(response.business);
        } else {
          setError(response.message || 'Consultant not found');
        }
      } catch (err) {
        setError('Error connecting to server. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultantInfo();
  }, [consultantEmail]);

  // Fetch appointments
  useEffect(() => {
    if (!consultantInfo?.email) return;
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [consultantInfo?.email]);

  const loadAppointments = async () => {
    if (!consultantInfo?.email) return;
    try {
      setLoading(true);
      setError('');
      const response = await appointmentAPI.getAppointments(consultantInfo.email);
      if (response.success) {
        const sortedAppointments = response.appointments.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAppointments(sortedAppointments);
        setNotifications(sortedAppointments.filter(apt => apt.status === 'pending').length);
      } else {
        setError(response.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError('Error connecting to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Accept/Reject/Reschedule actions
  const handleStatus = async (id, status, rescheduleData = null) => {
    try {
      setLoading(true);
      const response = await appointmentAPI.updateStatus(id, {
        status,
        ...(status === 'rescheduled' && rescheduleData ? rescheduleData : {})
      });
      if (response.success) {
        setAppointments(apps =>
          apps.map(app =>
            app._id === id
              ? { ...app, status, updatedAt: new Date().toISOString(), ...(status === 'rescheduled' && rescheduleData ? rescheduleData : {}) }
              : app
          )
        );
        setNotifications(apps => apps - (status === 'accepted' || status === 'rejected' ? 1 : 0));
      } else {
        alert( '  status updated');
      }
    } catch {
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  // Add service
  const handleAddService = async (newService) => {
    if (!consultantInfo) return;
    try {
      const response = await businessAPI.addService(consultantInfo.email, newService);
      if (response.success) {
        setConsultantInfo(prev => ({
          ...prev,
          services: [...prev.services, newService]
        }));
      }
    } catch (err) {
      alert('Error adding service');
    }
  };

  // Status helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle size={16} />;
      case 'accepted': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'rescheduled': return <RefreshCw size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'rescheduled': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch =
      apt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.customerPhone && apt.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    accepted: appointments.filter(a => a.status === 'accepted').length,
    rejected: appointments.filter(a => a.status === 'rejected').length
  };

  // Export CSV
  const exportAppointments = () => {
    const headers = ['Name', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Created At'];
    const csvData = [
      headers,
      ...appointments.map(apt => [
        apt.customerName,
        apt.customerPhone,
        apt.service,
        apt.date,
        apt.time,
        apt.status,
        apt.notes || '',
        new Date(apt.createdAt).toLocaleString()
      ])
    ];
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${consultantInfo?.businessName || 'consultant'}_appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !consultantInfo) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <RefreshCw size={48} className="loading-spinner" />
          <h3>Loading Consultant Dashboard</h3>
          <p>Please wait while we load your consultant information...</p>
        </div>
      </div>
    );
  }

  if (error && !consultantInfo) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle size={48} className="error-icon" />
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <Calendar size={24} className="logo-icon" />
              <div className="consultant-info">
                <h1 className="consultant-name">{consultantInfo?.businessName}</h1>
                <p className="consultant-tagline">Professional Consultant Management</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-badge">
              <Bell size={20} />
              {notifications > 0 && <span className="badge-count">{notifications}</span>}
            </div>
            <div className="user-menu">
              <User size={16} />
              <span>Manager</span>
              <ChevronDown size={16} />
            </div>
            <button className="logout-btn">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        {/* Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <BarChart3 size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total Appointments</div>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
            </div>
            <div className="stat-card accepted">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.accepted}</div>
                <div className="stat-label">Confirmed</div>
              </div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-icon">
                <XCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.rejected}</div>
                <div className="stat-label">Declined</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="tabs-section">
          <div className="tabs-container">
            <nav className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                <Calendar size={18} />
                Appointments
                <span className="tab-count">{stats.total}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'consultant-info' ? 'active' : ''}`}
                onClick={() => setActiveTab('consultant-info')}
              >
                <User size={18} />
                Consultant Information
              </button>
              <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={18} />
                Settings
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'appointments' && (
                <div className="appointments-tab">
                  <div className="appointments-header">
                    <div className="search-filters">
                      <div className="search-box">
                        <Search size={20} />
                        <input
                          type="text"
                         
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="status-filter"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Confirmed</option>
                        <option value="rejected">Declined</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>
                    <div className="header-actions">
                      <button
                        className="refresh-btn"
                        onClick={loadAppointments}
                        disabled={loading}
                      >
                        <RefreshCw size={16} /> Refresh
                      </button>
                      {appointments.length > 0 && (
                        <button className="export-btn" onClick={exportAppointments}>
                          <Download size={16} /> Export
                        </button>
                      )}
                    </div>
                  </div>

                  {loading && appointments.length === 0 ? (
                    <div className="loading-state">
                      <RefreshCw size={32} className="loading-spinner" />
                      <p>Loading appointments...</p>
                    </div>
                  ) : (
                    <div className="appointments-list">
                      <div className="appointments-grid">
                        {filteredAppointments.length === 0 ? (
                          <div className="empty-state">
                            <Calendar size={48} />
                            <h3>No appointments found</h3>
                            <p>Your scheduled appointments will appear here</p>
                          </div>
                        ) : (
                          filteredAppointments.map(appointment => (
                            <div key={appointment._id} className="appointment-card">
                              <div className="appointment-header">
                                <div className="appointment-service">
                                  <Calendar size={18} />
                                  <span>{appointment.service}</span>
                                </div>
                                <span
                                  className="appointment-status"
                                  style={{
                                    backgroundColor: `${getStatusColor(appointment.status)}15`,
                                    color: getStatusColor(appointment.status),
                                    border: `1px solid ${getStatusColor(appointment.status)}30`
                                  }}
                                >
                                  {getStatusIcon(appointment.status)}
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              <div className="appointment-details">
                                <div className="detail-item">
                                  <User size={16} />
                                  <span>{appointment.customerName}</span>
                                </div>
                                <div className="detail-item">
                                  <Mail size={16} />
                                  <span>{appointment.customerEmail}</span>
                                </div>
                                <div className="detail-item">
                                  <Phone size={16} />
                                  <span>{appointment.customerPhone}</span>
                                </div>
                                <div className="detail-item">
                                  <Calendar size={16} />
                                  <span>{appointment.date}</span>
                                </div>
                                <div className="detail-item">
                                  <Clock size={16} />
                                  <span>{appointment.time}</span>
                                </div>
                                {appointment.notes && (
                                  <div className="detail-item">
                                    <FileText size={16} />
                                    <span>{appointment.notes}</span>
                                  </div>
                                )}
                              </div>
                              <div className="appointment-actions">
                                {appointment.status === 'pending' && (
                                  <div className="action-buttons">
                                    <button
                                      onClick={() => handleStatus(appointment._id, 'accepted')}
                                      className="action-btn accept"
                                    >
                                      <Check size={16} /> Accept
                                    </button>
                                    <button
                                      onClick={() => handleStatus(appointment._id, 'rejected')}
                                      className="action-btn reject"
                                    >
                                      <X size={16} /> Reject
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newDate = prompt('Enter new date (YYYY-MM-DD):', appointment.date);
                                        const newTime = prompt('Enter new time:', appointment.time);
                                        if (newDate && newTime) {
                                          handleStatus(appointment._id, 'rescheduled', { date: newDate, time: newTime });
                                        }
                                      }}
                                      className="action-btn reschedule"
                                    >
                                      <RefreshCw size={16} /> Reschedule
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'consultant-info' && consultantInfo && (
                <div className="consultant-info-tab">
                  <div className="info-section">
                    <h3 className="section-title">Consultant Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Name:</strong> {consultantInfo.businessName}
                      </div>
                      <div className="info-item">
                        <strong>Email:</strong> {consultantInfo.email}
                      </div>
                      <div className="info-item">
                        <strong>Phone:</strong> {consultantInfo.phone || "Not set"}
                      </div>
                      <div className="info-item">
                        <strong>Address:</strong> {consultantInfo.address || "Not set"}
                      </div>
                      <div className="info-item">
                        <strong>Working Hours:</strong> {consultantInfo.workingHours || "Not set"}
                      </div>
                    </div>
                  </div>
                  <div className="services-section">
                    <h3 className="section-title">Services Offered</h3>
                    <div className="services-grid">
                      {consultantInfo.services.map((service, i) => (
                        <div key={i} className="service-item">
                          <CheckCircle size={16} style={{ color: '#10b981' }} /> {service}
                        </div>
                      ))}
                    </div>
                    <button
                      className="add-service-btn"
                      onClick={() => {
                        const newService = prompt('Enter new service name:');
                        if (newService && !consultantInfo.services.includes(newService)) {
                          handleAddService(newService);
                        }
                      }}
                    >
                      <Plus size={16} /> Add New Service
                    </button>
                  </div>
                  <div className="booking-section">
                    <h3 className="section-title">Online Booking</h3>
                    <p>Clients can book appointments using:</p>
                    <div className="booking-info">
                      <code className="booking-email">{consultantInfo.email}</code>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(consultantInfo.email)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="settings-tab">
                  <div className="settings-section">
                    <h3 className="section-title">Notification Preferences</h3>
                    <div className="settings-group">
                      <label className="setting-item">
                        <input type="checkbox" defaultChecked />
                        <span>Email Notifications</span>
                      </label>
                      <label className="setting-item">
                        <input type="checkbox" defaultChecked />
                        <span>Auto-refresh Dashboard</span>
                      </label>
                      <label className="setting-item">
                        <input type="checkbox" />
                        <span>Sound Notifications</span>
                      </label>
                    </div>
                  </div>
                  <div className="settings-section">
                    <h3 className="section-title">Data Management</h3>
                    <div className="settings-actions">
                      <button className="setting-btn">
                        <Edit2 size={16} /> Edit Profile
                      </button>
                      <button className="setting-btn" onClick={loadAppointments}>
                        <RefreshCw size={16} /> Refresh Data
                      </button>
                      <button
                        className="setting-btn"
                        onClick={exportAppointments}
                        disabled={appointments.length === 0}
                      >
                        <Download size={16} /> Export All Data
                      </button>
                    </div>
                  </div>
                  <div className="settings-section">
                    <h3 className="section-title">Support</h3>
                    <p>Need assistance with your consultant dashboard?</p>
                    <button className="support-btn">
                      <Mail size={16} /> Contact Support
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ConsultantDashboard;
