import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  X,
  Edit2,
  Bell,
  LogOut,
  Plus,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { appointmentAPI, businessAPI } from '../utils/api';
import './salonDashboard.css';

const SalonDashboard = () => {
  const { businessEmail } = useParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salonInfo, setSalonInfo] = useState(null);
  const [notifications, setNotifications] = useState(0);

  // Fetch salon info from backend
  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const email = businessEmail ? decodeURIComponent(businessEmail) : 'glamoursalon@gmail.com';
        const response = await businessAPI.getByEmail(email);
        console.log('Salon API response:', response); // <-- Add this for debugging
        if (response.success && response.business) {
          setSalonInfo({
            _id: response.business._id, // <-- Add this line
            name: response.business.businessName,
            email: response.business.email,
            address: response.business.address,
            phone: response.business.phone,
            services: response.business.services || [],
            workingHours: response.business.workingHours || '9:00 AM - 7:00 PM'
          });
        } else {
          setError(response.message || 'Salon not found');
        }
      } catch (err) {
        setError('Error connecting to server. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchSalonInfo();
  }, [businessEmail]);

  // Load appointments from backend
  useEffect(() => {
    if (!salonInfo?.email) return;
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [salonInfo?.email]);

  const loadAppointments = async () => {
    if (!salonInfo?.email) return;
    try {
      setLoading(true);
      setError('');
      const response = await appointmentAPI.getAppointments(salonInfo.email);
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

  // Handle appointment actions
  const handleAppointmentAction = async (appointmentId, action, rescheduleData = null) => {
    try {
      let newStatus;
      if (action === 'accept') newStatus = 'accepted';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'reschedule') newStatus = 'rescheduled';

      const response = await appointmentAPI.updateStatus(appointmentId, {
        status: newStatus,
        ...(action === 'reschedule' && rescheduleData ? rescheduleData : {})
      });
      if (response.success) {
        setAppointments(prev =>
          prev.map(apt =>
            apt._id === appointmentId
              ? {
                  ...apt,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                  ...(action === 'reschedule' && rescheduleData ? rescheduleData : {})
                }
              : apt
          )
        );
        setNotifications(prev =>
          prev - (action === 'accept' || action === 'reject' ? 1 : 0)
        );
        alert(
          action === 'accept'
            ? 'Appointment accepted!'
            : action === 'reject'
            ? 'Appointment rejected!'
            : 'Reschedule request sent!'
        );
      } else {
       
      }
    } catch (err) {
      alert('Error updating appointment. Please try again.');
    }
  };

  // Add new service to salon (save to backend)
  const handleAddService = async (newService) => {
    if (!salonInfo) return;
    try {
      const updatedServices = [...salonInfo.services, newService];
      const response = await businessAPI.updateBusiness({
        _id: salonInfo._id, // Add this line
        businessName: salonInfo.name, // Use businessName for backend
        email: salonInfo.email,
        address: salonInfo.address,
        phone: salonInfo.phone,
        services: updatedServices,
        workingHours: salonInfo.workingHours
      });
      if (response.success) {
        setSalonInfo(prev => ({
          ...prev,
          services: updatedServices
        }));
        alert('Service added successfully!');
      } else {
        alert('Failed to add service.');
      }
    } catch (err) {
      alert('Error adding service. Please try again.');
    }
  };

  // Status color and icon
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'rescheduled': return '#3b82f6';
      default: return '#6b7280';
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle size={16} />;
      case 'accepted': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'rescheduled': return <RefreshCw size={16} />;
      default: return <Clock size={16} />;
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
    pending: appointments.filter(apt => apt.status === 'pending').length,
    accepted: appointments.filter(apt => apt.status === 'accepted').length,
    rejected: appointments.filter(apt => apt.status === 'rejected').length
  };

  // Export appointments to CSV
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
    a.download = `${salonInfo?.name || 'salon'}_appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading or error state
  if (loading && !salonInfo) {
    return (
      <div className="salon-dashboard">
        <div className="loading-state">
          <RefreshCw size={48} className="spinning" />
          <h3>Loading salon dashboard...</h3>
        </div>
      </div>
    );
  }
  if (error && !salonInfo) {
    return (
      <div className="salon-dashboard">
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <div className="salon-logo">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="salon-title">{salonInfo?.name}</h1>
              <p className="salon-subtitle">
                Salon Manager Dashboard • {salonInfo?.email}
              </p>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-icon">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </div>
            <div className="user-info">
              <User size={16} style={{ color: '#64748b' }} />
              <span>Manager</span>
              <ChevronDown size={16} style={{ color: '#64748b' }} />
            </div>
            <LogOut size={20} className="logout-icon" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon purple">
                <Calendar size={24} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <p className="stats-number">{stats.total}</p>
                <p className="stats-label">Total Appointments</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon yellow">
                <Clock size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="stats-number">{stats.pending}</p>
                <p className="stats-label">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon green">
                <Check size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="stats-number">{stats.accepted}</p>
                <p className="stats-label">Accepted</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon red">
                <X size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="stats-number">{stats.rejected}</p>
                <p className="stats-label">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Container */}
        <div className="tab-container">
          <div className="tab-navigation">
            {[
              { id: 'appointments', label: 'Appointments', count: stats.total },
              { id: 'salon-info', label: 'Salon Information', count: null },
              { id: 'settings', label: 'Settings', count: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`tab-count ${activeTab === tab.id ? 'active' : ''}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'appointments' && (
              <div>
                {/* Action Bar */}
                <div className="appointment-actions-bar">
                  <div className="filters">
                    <div className="search-container">
                      <Search size={20} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>
                  <div className="action-buttons-top">
                    <button
                      onClick={loadAppointments}
                      className="refresh-button"
                      title="Refresh appointments"
                      disabled={loading}
                    >
                      <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    {appointments.length > 0 && (
                      <button
                        onClick={exportAppointments}
                        className="export-button"
                        title="Export to CSV"
                      >
                        <Download size={16} />
                        Export
                      </button>
                    )}
                  </div>
                </div>
                {/* Real-time Status */}
                {appointments.length > 0 && (
                  <div className="real-time-status">
                    <div className="status-indicator">
                      <div className="pulse-dot"></div>
                      <span>Live Updates Active</span>
                    </div>
                    <span className="last-updated">
                      Last checked: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {/* Loading State */}
                {loading && appointments.length === 0 && (
                  <div className="loading-state">
                    <RefreshCw size={48} className="spinning" />
                    <h3>Loading appointments...</h3>
                    <p>Please wait while we fetch your latest appointments.</p>
                  </div>
                )}
                {/* Appointments List */}
                <div className="appointments-list">
                  {filteredAppointments.map(appointment => (
                    <div key={appointment._id} className="appointment-card">
                      <div className="appointment-layout">
                        <div className="appointment-details">
                          {/* Customer Info */}
                          <div className="customer-info">
                            <h4>{appointment.customerName}</h4>
                            <div className="customer-contact">
                              <div className="contact-item">
                                <Phone size={14} style={{ color: '#6b7280' }} />
                                <span>{appointment.customerPhone}</span>
                              </div>
                              <div className="contact-item">
                                <Mail size={14} style={{ color: '#6b7280' }} />
                                <span>Business Email: {appointment.businessEmail}</span>
                              </div>
                            </div>
                          </div>
                          {/* Service Info */}
                          <div className="service-info">
                            <p>{appointment.service}</p>
                            <div className="appointment-datetime">
                              <div className="datetime-item">
                                <Calendar size={14} style={{ color: '#6b7280' }} />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                              </div>
                              <div className="datetime-item">
                                <Clock size={14} style={{ color: '#6b7280' }} />
                                <span>{appointment.time}</span>
                              </div>
                            </div>
                          </div>
                          {/* Notes */}
                          <div className="notes-section">
                            <p className="notes-label">Notes:</p>
                            <p className="notes-text">
                              {appointment.notes || 'No special notes'}
                            </p>
                            <p className="notes-timestamp">
                              Requested: {new Date(appointment.createdAt).toLocaleString()}
                            </p>
                            {appointment.updatedAt && appointment.updatedAt !== appointment.createdAt && (
                              <p className="notes-timestamp">
                                Last updated: {new Date(appointment.updatedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Status and Actions */}
                        <div className="appointment-actions">
                          <div
                            className="status-badge"
                            style={{
                              border: `1px solid ${getStatusColor(appointment.status)}`,
                              color: getStatusColor(appointment.status)
                            }}
                          >
                            {getStatusIcon(appointment.status)}
                            <span>{appointment.status}</span>
                          </div>
                          {appointment.status === 'pending' && (
                            <div className="action-buttons">
                              <button
                                onClick={() => handleAppointmentAction(appointment._id, 'accept')}
                                className="action-button accept"
                              >
                                <Check size={16} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment._id, 'reject')}
                                className="action-button reject"
                              >
                                <X size={16} />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  const newDate = prompt('Enter new date (YYYY-MM-DD):', appointment.date);
                                  const newTime = prompt('Enter new time:', appointment.time);
                                  if (newDate && newTime) {
                                    handleAppointmentAction(appointment._id, 'reschedule', {
                                      date: newDate,
                                      time: newTime
                                    });
                                  }
                                }}
                                className="action-button reschedule"
                              >
                                <RefreshCw size={16} />
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && filteredAppointments.length === 0 && (
                    <div className="empty-state">
                      {appointments.length === 0 ? (
                        <>
                          <Calendar size={48} />
                          <h3>No appointments yet</h3>
                          <p>New appointments will appear here when customers book through your business email.</p>
                          <div className="booking-link-info">
                            <h4>Customers can book using your business email:</h4>
                            <div className="booking-link">
                              <code>{salonInfo?.email}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(salonInfo?.email || '');
                                  alert('Business email copied to clipboard!');
                                }}
                                className="copy-button"
                              >
                                Copy Email
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Search size={48} />
                          <h3>No appointments found</h3>
                          <p>Try adjusting your search term or filter criteria</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'salon-info' && salonInfo && (
              <div>
                <div className="salon-info-grid">
                  <div className="info-section">
                    <h3>Business Information</h3>
                    <div className="form-group">
                      <div className="form-field">
                        <label>Salon Name</label>
                        <p>{salonInfo.name}</p>
                      </div>
                      <div className="form-field">
                        <label>Business Email</label>
                        <p>{salonInfo.email}</p>
                        <small>This email is used for receiving appointment bookings</small>
                      </div>
                      <div className="form-field">
                        <label>Address</label>
                        <p>{salonInfo.address}</p>
                      </div>
                      <div className="form-row">
                        <div className="form-field">
                          <label>Phone</label>
                          <p>{salonInfo.phone}</p>
                        </div>
                        <div className="form-field">
                          <label>Working Hours</label>
                          <p>{salonInfo.workingHours}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h3>Services Offered</h3>
                    <div className="services-grid">
                      {salonInfo.services.map((service, index) => (
                        <div key={index} className="service-item">
                          <span>{service}</span>
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        </div>
                      ))}
                    </div>
                    <button
                      className="add-service-button"
                      onClick={() => {
                        const newService = prompt('Enter new service name:');
                        if (newService && !salonInfo.services.includes(newService)) {
                          handleAddService(newService);
                        }
                      }}
                    >
                      <Plus size={16} />
                      Add Service
                    </button>
                  </div>
                </div>
                <div className="booking-info-section">
                  <h3>Online Booking Instructions</h3>
                  <p>Share these instructions with customers for booking appointments:</p>
                  <div className="booking-instructions">
                    <ol>
                      <li>Go to our booking page</li>
                      <li>Enter your business email: <strong>{salonInfo.email}</strong></li>
                      <li>Select from available services</li>
                      <li>Choose preferred date and time</li>
                      <li>Submit the appointment request</li>
                    </ol>
                  </div>
                </div>
                <div className="alert info">
                  <AlertCircle size={20} style={{ color: '#3b82f6' }} />
                  <p>
                    Appointments booked through your email ({salonInfo.email}) will appear in your dashboard automatically.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="settings-grid">
                  <div className="settings-section">
                    <h3>Notification Settings</h3>
                    <div className="settings-item">
                      <div>
                        <h4>Email Notifications</h4>
                        <p>Receive emails for new appointments</p>
                      </div>
                      <input type="checkbox" defaultChecked className="settings-checkbox" />
                    </div>
                    <div className="settings-item">
                      <div>
                        <h4>Auto-refresh Dashboard</h4>
                        <p>Automatically check for new appointments every 30 seconds</p>
                      </div>
                      <input type="checkbox" defaultChecked className="settings-checkbox" />
                    </div>
                    <div className="settings-item">
                      <div>
                        <h4>Sound Notifications</h4>
                        <p>Play sound when new appointments arrive</p>
                      </div>
                      <input type="checkbox" className="settings-checkbox" />
                    </div>
                  </div>
                  <div className="settings-section">
                    <h3>Data Management</h3>
                    <div className="account-buttons">
                      <button
                        className="settings-button primary"
                        onClick={() => alert('Profile editing feature coming soon!')}
                      >
                        <Edit2 size={16} />
                        Edit Profile
                      </button>
                      <button
                        className="settings-button secondary"
                        onClick={loadAppointments}
                      >
                        <RefreshCw size={16} />
                        Refresh Data
                      </button>
                      <button
                        className="settings-button secondary"
                        onClick={exportAppointments}
                        disabled={appointments.length === 0}
                      >
                        <Download size={16} />
                        Export All Data
                      </button>
                    </div>
                  </div>
                </div>
                <div className="alert info">
                  <h4>Need Help?</h4>
                  <p>
                    Our support team is here to help you manage your appointment bookings effectively.
                    Contact us for any technical issues or questions about using the dashboard.
                  </p>
                  <div className="help-buttons">
                    <button
                      className="help-button primary"
                      onClick={() => alert('Opening support chat...')}
                    >
                      <Mail size={16} />
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDashboard;