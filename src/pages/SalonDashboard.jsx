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
  Download,
  Settings,
  BarChart3,
  Users,
  Scissors,
  Building2,
  FileText
} from 'lucide-react';
import { appointmentAPI, businessAPI } from '../utils/api';
import axios from 'axios';
import './SalonDashboard.css';

const SalonDashboard = () => {
  const { businessEmail } = useParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salonInfo, setSalonInfo] = useState(null);
  const [notifications, setNotifications] = useState(0);
  
  // ✅ Add these missing state variables for Edit Profile
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    businessName: '',
    businessAddress: '',
    workingHours: '',
    phone: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch salon info
  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        console.log('🔄 Fetching salon info for:', businessEmail);
        
        const response = await axios.get(
          `http://localhost:5000/api/business/email/${encodeURIComponent(businessEmail)}`
        );
        
        console.log('📥 API Response:', response.data);
        
        if (response.data.success && response.data.business) {
          const businessData = response.data.business;
          
          console.log('🏢 Business Data:', businessData);
          
          setSalonInfo({
            _id: businessData._id,
            name: businessData.businessName,
            email: businessData.email,
            address: businessData.businessAddress,
            phone: businessData.phone,
            services: businessData.services || [],
            workingHours: businessData.workingHours || '9:00 AM - 7:00 PM',
            imageUrl: businessData.imageUrl || null
          });
          
          console.log('✅ Salon info updated:', {
            name: businessData.businessName,
            imageUrl: businessData.imageUrl
          });
        } else {
          console.log('❌ API Error:', response.data.message);
          setError(response.data.message || 'Salon not found');
        }
      } catch (err) {
        console.error('❌ Fetch salon info error:', err);
        setError('Error connecting to server. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    
    if (businessEmail) {
      fetchSalonInfo();
    }
  }, [businessEmail]);

  // Load appointments
  useEffect(() => {
    if (!salonInfo?.email) return;
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
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

  // Handle appointment action
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
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  // Add service
  const handleAddService = async (newService) => {
    if (!salonInfo) return;
    try {
      const response = await axios.post(
        `http://localhost:5000/api/business/email/${encodeURIComponent(salonInfo.email)}/add-service`,
        { service: newService }
      );
      if (response.data.success) {
        setSalonInfo(prev => ({
          ...prev,
          services: response.data.services
        }));
      }
    } catch (err) {
      console.error('Error adding service:', err);
    }
  };

  // ✅ Add missing functions for Edit Profile
  // Open edit modal with current data
  const openEditModal = () => {
    setEditFormData({
      businessName: salonInfo.name || '',
      businessAddress: salonInfo.address || '',
      workingHours: salonInfo.workingHours || '',
      phone: salonInfo.phone || ''
    });
    if (salonInfo.imageUrl) {
      setImagePreview(`http://localhost:5000${salonInfo.imageUrl}`);
    } else {
      setImagePreview(null);
    }
    setShowEditModal(true);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle profile update with image
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      console.log('📤 Starting profile update...');
      
      const formData = new FormData();
      formData.append('businessName', editFormData.businessName);
      formData.append('businessAddress', editFormData.businessAddress);
      formData.append('workingHours', editFormData.workingHours);
      formData.append('phone', editFormData.phone);
      
      if (selectedImage) {
        formData.append('businessImage', selectedImage);
        console.log('🖼️ Image selected:', selectedImage.name);
      }
      
      console.log('📤 Sending update request to:', `http://localhost:5000/api/business/update-profile/${salonInfo.email}`);
      
      const response = await fetch(`http://localhost:5000/api/business/update-profile/${salonInfo.email}`, {
        method: 'PUT',
        body: formData
      });
      
      const result = await response.json();
      console.log('📥 Update response:', result);
      
      if (result.success) {
        // Update salon info with new data
        setSalonInfo(prev => ({
          ...prev,
          name: result.business.businessName,
          address: result.business.businessAddress,
          workingHours: result.business.workingHours,
          phone: result.business.phone,
          imageUrl: result.business.imageUrl || prev.imageUrl
        }));
        
        console.log('✅ Profile updated successfully');
        
        setShowEditModal(false);
        setSelectedImage(null);
        setImagePreview(null);
        alert('Profile updated successfully!');
        
      } else {
        console.log('❌ Update failed:', result.message);
        alert(`Failed to update profile: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Error updating profile. Please try again.');
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
      case 'pending': return '#FFA500'; // Orange
      case 'accepted': return '#4CAF50'; // Green
      case 'rejected': return '#F44336'; // Red
      case 'rescheduled': return '#2196F3'; // Blue
      default: return '#9E9E9E'; // Grey
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
    a.download = `${salonInfo?.name || 'salon'}_appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Add Edit Profile Modal Component
  const EditProfileModal = () => (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Edit Profile</h3>
          <button 
            onClick={() => setShowEditModal(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleProfileUpdate}>
          {/* Image Upload Section */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Business Image:
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageSelect}
              style={{ marginBottom: '10px' }}
            />
            {imagePreview && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    width: '150px', 
                    height: '150px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #ddd'
                  }} 
                />
              </div>
            )}
          </div>
          
          {/* Business Name */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Business Name:
            </label>
            <input 
              type="text" 
              value={editFormData.businessName}
              onChange={(e) => setEditFormData({...editFormData, businessName: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
              required
            />
          </div>
          
          {/* Business Address */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Address:
            </label>
            <input 
              type="text" 
              value={editFormData.businessAddress}
              onChange={(e) => setEditFormData({...editFormData, businessAddress: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
              required
            />
          </div>
          
          {/* Working Hours */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Working Hours:
            </label>
            <input 
              type="text" 
              value={editFormData.workingHours}
              onChange={(e) => setEditFormData({...editFormData, workingHours: e.target.value})}
              placeholder="e.g., 9:00 AM - 7:00 PM"
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
              required
            />
          </div>
          
          {/* Phone */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Phone:
            </label>
            <input 
              type="text" 
              value={editFormData.phone}
              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
              required
            />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={() => setShowEditModal(false)}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                background: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Add this function after your existing functions (around line 160):

  const handleCompleteService = async (appointmentId) => {
    const confirmed = confirm('Mark this service as completed? Customer will be able to rate after this.');
    if (!confirmed) return;
    
    try {
      const response = await axios.put(`http://localhost:5000/api/appointments/${appointmentId}/complete`);
      if (response.data.success) {
        // Update appointments list
        setAppointments(prev =>
          prev.map(apt =>
            apt._id === appointmentId
              ? { ...apt, status: 'completed', completedAt: new Date().toISOString() }
              : apt
          )
        );
        alert('Service marked as completed! Customer can now rate.');
      } else {
        alert('Failed to complete: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Error completing service');
    }
  };

  if (loading && !salonInfo) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <RefreshCw size={48} className="loading-spinner" />
          <h3>Loading Salon Dashboard</h3>
          <p>Please wait while we load your salon information...</p>
        </div>
      </div>
    );
  }

  if (error && !salonInfo) {
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
              {/* ✅ Show salon image in header if available */}
              {salonInfo?.imageUrl ? (
                <img 
                  src={`http://localhost:5000${salonInfo.imageUrl}`}
                  alt={salonInfo.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '10px'
                  }}
                />
              ) : (
                <Scissors size={24} className="logo-icon" />
              )}
              <div className="salon-info">
                <h1 className="salon-name">{salonInfo?.name}</h1>
                <p className="salon-tagline">Professional Salon Management</p>
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
                className={`tab-btn ${activeTab === 'salon-info' ? 'active' : ''}`}
                onClick={() => setActiveTab('salon-info')}
              >
                <Scissors size={18} /> 
                Salon Information
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
                          placeholder="Search appointments..."
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
                                  <Building2 size={18} />
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
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              <div className="appointment-details">
                                <div className="detail-item">
                                  <User size={16} />
                                  <span>{appointment.customerName || appointment.customerEmail || 'Customer'}</span>
                                </div>
                                <div className="detail-item">
                                  <Calendar size={16} />
                                  <span>{new Date(appointment.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</span>
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
                              {appointment.status === 'pending' && (
                                <div className="appointment-actions">
                                  <button
                                    className="action-btn accept"
                                    onClick={() => handleAppointmentAction(appointment._id, 'accept')}
                                  >
                                    <Check size={16} /> Accept
                                  </button>
                                  <button
                                    className="action-btn reject"
                                    onClick={() => handleAppointmentAction(appointment._id, 'reject')}
                                  >
                                    <X size={16} /> Reject
                                  </button>
                                  <button
                                    className="action-btn reschedule"
                                    onClick={() => {
                                      const newDate = prompt('Enter new date (YYYY-MM-DD):', appointment.date);
                                      const newTime = prompt('Enter new time:', appointment.time);
                                      if (newDate && newTime) {
                                        handleAppointmentAction(appointment._id, 'reschedule', { date: newDate, time: newTime });
                                      }
                                    }}
                                  >
                                    <RefreshCw size={16} /> Reschedule
                                  </button>
                                </div>
                              )}
                              {appointment.status === 'accepted' && (
                                <button
                                  onClick={() => handleCompleteService(appointment._id)}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  ✅ Mark Service Complete
                                </button>
                              )}
                              {appointment.status === 'completed' && (
                                <div style={{
                                  backgroundColor: '#f0fdf4',
                                  border: '2px solid #10b981',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  marginTop: '8px'
                                }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>
                                    🎉 SERVICE COMPLETED
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#047857' }}>
                                    Customer can now rate this service
                                  </div>
                                  {appointment.completedAt && (
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                      Completed on {new Date(appointment.completedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'salon-info' && (
                <div className="salon-info-tab">
                  <div className="info-section">
                    <h3 className="section-title">Business Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Salon Name:</strong> {salonInfo.name}
                      </div>
                      <div className="info-item">
                        <strong>Business Email:</strong> {salonInfo.email}
                      </div>
                      <div className="info-item">
                        <strong>Phone:</strong> {salonInfo.phone}
                      </div>
                      <div className="info-item">
                        <strong>Address:</strong> {salonInfo.address}
                      </div>
                      <div className="info-item">
                        <strong>Working Hours:</strong> {salonInfo.workingHours}
                      </div>
                    </div>
                  </div>

                  <div className="services-section">
                    <h3 className="section-title">Services Offered</h3>
                    <div className="services-grid">
                      {salonInfo.services.map((service, i) => (
                        <div key={i} className="service-item">
                          <Scissors size={16} /> {service}
                        </div>
                      ))}
                    </div>
                    <button
                      className="add-service-btn"
                      onClick={() => {
                        const newService = prompt('Enter new service name:');
                        if (newService && !salonInfo.services.includes(newService)) {
                          handleAddService(newService);
                        }
                      }}
                    >
                      <Plus size={16} /> Add New Service
                    </button>
                  </div>

                  <div className="booking-section">
                    <h3 className="section-title">Online Booking</h3>
                    <p>Customers can book appointments using:</p>
                    <div className="booking-info">
                      <code className="booking-email">{salonInfo.email}</code>
                      <button 
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(salonInfo.email)}
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
                      {/* ✅ Fix: Add onClick handler for Edit Profile button */}
                      <button className="setting-btn" onClick={openEditModal}>
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
                    <p>Need assistance with your salon dashboard?</p>
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

      {/* ✅ Add Edit Profile Modal */}
      {showEditModal && <EditProfileModal />}
    </div>
  );
};

export default SalonDashboard;