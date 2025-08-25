import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Send, 
  CheckCircle,
  MapPin,
  FileText,
  Building2,
  Loader2,
  CalendarDays,
  AlertCircle,
  Info
} from 'lucide-react';
import { businessAPI, appointmentAPI } from '../utils/api';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const customerEmail = localStorage.getItem('email');
  const [customerName, setCustomerName] = useState('');
  const [formData, setFormData] = useState({
    customerName: customerName || '',
    customerPhone: '',
    businessEmail: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });

  const [services, setServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('booking');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [loadingBookedTimes, setLoadingBookedTimes] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '19:00' });
  const [businessName, setBusinessName] = useState('');
  const [showWorkingHours, setShowWorkingHours] = useState(false);

  // Add state for businesses and selected business
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCustomerName = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/customer/${encodeURIComponent(customerEmail)}`
        );
        if (response.data.success) setCustomerName(response.data.name);
      } catch (error) {
        console.error('Error fetching customer name:', error);
      }
    };
    fetchCustomerName();
  }, [customerEmail]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await appointmentAPI.getAppointmentsByCustomer(customerEmail);
        if (response.success) setAppointments(response.appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };
    fetchAppointments();
  }, [customerEmail]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      customerName: customerName || ''
    }));
  }, [customerName]);

  // Fetch booked times when businessEmail, service, or date changes
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (formData.businessEmail && formData.service && formData.date) {
        setLoadingBookedTimes(true);
        try {
          const response = await axios.get('http://localhost:5000/api/appointments/booked-times/check', {
            params: {
              businessEmail: formData.businessEmail,
              service: formData.service,
              date: formData.date
            }
          });
          
          if (response.data.success) {
            setBookedTimes(response.data.bookedTimes || []);
          } else {
            setBookedTimes([]);
          }
        } catch (error) {
          console.error('Error fetching booked times:', error);
          setBookedTimes([]);
        } finally {
          setLoadingBookedTimes(false);
        }
      } else {
        setBookedTimes([]);
      }
    };

    fetchBookedTimes();
  }, [formData.businessEmail, formData.service, formData.date]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setBookingError(''); // Clear any previous booking errors

    if (name === 'businessEmail' && /\S+@\S+\.\S+/.test(value)) {
      await fetchBusinessServices(value);
    }

    // Reset time selection when service or date changes
    if (name === 'service' || name === 'date') {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  };

  const fetchBusinessServices = async (email) => {
    setServices([]);
    setServiceError('');
    setBusinessName('');
    setWorkingHours({ start: '09:00', end: '19:00' });
    setShowWorkingHours(false);

    if (!email) return;

    try {
      const response = await businessAPI.getByEmail(email);
      if (response.success && response.business) {
        const business = response.business;

        // Set services
        setServices(business.services || []);

        // Set business name
        setBusinessName(business.businessName || business.name || 'Business');

        // --- Paste here: normalize and parse working hours ---
        const normalizeTimeString = (str) => {
          // Add space before AM/PM if missing
          return str.replace(/([0-9])([AP]M)/gi, '$1 $2');
        };

        if (business.workingHours) {
          const workingHoursStr = business.workingHours.trim();
          console.log('Raw working hours:', workingHoursStr);

          if (workingHoursStr.includes('-')) {
            const [startRaw, endRaw] = workingHoursStr.split('-');
            const startNorm = normalizeTimeString(startRaw.trim());
            const endNorm = normalizeTimeString(endRaw.trim());
            const start = convertTo24Hour(startNorm);
            const end = convertTo24Hour(endNorm);

            console.log('Converted working hours:', { start, end });
            setWorkingHours({ start, end });
            setShowWorkingHours(true);
          } else {
            setWorkingHours({ start: '09:00', end: '19:00' });
            setShowWorkingHours(false);
          }
        } else {
          setWorkingHours({ start: '09:00', end: '19:00' });
          setShowWorkingHours(false);
        }
        // --- End paste ---
      } else {
        setServiceError('Business not found or error fetching services.');
        setServices([]);
        setBusinessName('');
        setWorkingHours({ start: '09:00', end: '19:00' });
        setShowWorkingHours(false);
      }
    } catch (error) {
      setServiceError('Business not found or error fetching services.');
      setServices([]);
      setBusinessName('');
      setWorkingHours({ start: '09:00', end: '19:00' });
      setShowWorkingHours(false);
      console.error('Error fetching business:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingError('');
    
    try {
      const response = await appointmentAPI.create({
        ...formData,
        customerEmail,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      if (response.data && response.data.success) {
        setIsSuccess(true);
        // Refresh appointments list
        const appointmentsResponse = await appointmentAPI.getAppointmentsByCustomer(customerEmail);
        if (appointmentsResponse.success) {
          setAppointments(appointmentsResponse.appointments);
        }
        
        setTimeout(() => {
          setFormData({
            customerName: customerName || '',
            customerPhone: '',
            businessEmail: '',
            service: '',
            date: '',
            time: '',
            notes: ''
          });
          setIsSuccess(false);
          setServices([]);
          setServiceError('');
          setBookedTimes([]);
          setBusinessName('');
          setWorkingHours({ start: '09:00', end: '19:00' });
          setShowWorkingHours(false);
        }, 3000);
      } else {
        setBookingError(response.data?.message || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setBookingError(error.response.data.message);
      } else if (error.response && error.response.status === 409) {
        setBookingError('This time slot is already booked. Please select a different time.');
      } else {
        setBookingError('Failed to book appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.customerName &&
      formData.customerPhone &&
      formData.businessEmail &&
      formData.service &&
      formData.date &&
      formData.time
    );
  };

  // Helper function to convert 12-hour to 24-hour format
  const convertTo24Hour = (timeStr) => {
    try {
      if (!timeStr || typeof timeStr !== 'string') return '09:00';
      
      // Remove extra spaces and handle different formats
      const cleanTime = timeStr.trim().replace(/\s+/g, ' ');
      
      // If already in 24-hour format
      if (!cleanTime.includes('AM') && !cleanTime.includes('PM')) {
        // Validate format HH:MM
        if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
          const [h, m] = cleanTime.split(':');
          const hour = parseInt(h, 10);
          if (hour >= 0 && hour <= 23) {
            return `${hour.toString().padStart(2, '0')}:${m}`;
          }
        }
        return '09:00';
      }
      
      // Handle 12-hour format
      const [time, modifier] = cleanTime.split(' ');
      if (!time || !modifier) return '09:00';
      
      let [hours, minutes] = time.split(':');
      if (!hours || !minutes) return '09:00';
      
      hours = parseInt(hours, 10);
      
      if (isNaN(hours) || hours < 1 || hours > 12) return '09:00';
      
      if (modifier.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error('Error converting time:', error);
      return '09:00';
    }
  };

  // Helper function to check if time is within working hours
  const isWithinWorkingHours = (time, start, end) => {
    try {
      const toMinutes = (t) => {
        const [h, m] = t.split(':').map(num => parseInt(num, 10));
        return h * 60 + m;
      };
      
      const timeMinutes = toMinutes(time);
      const startMinutes = toMinutes(start);
      const endMinutes = toMinutes(end);
      
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    } catch (error) {
      console.error('Error checking working hours:', error);
      return true; // Default to true if there's an error
    }
  };

  // Generate time slots (30-minute intervals from 6 AM to 11 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: time, label });
      }
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots();
  
  // Filter time slots based on working hours
  const availableTimeSlots = allTimeSlots.filter(slot => 
    isWithinWorkingHours(slot.value, workingHours.start, workingHours.end)
  );

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'rescheduled': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  // Convert 24-hour to 12-hour for display
  const formatTimeFor12Hour = (time24) => {
    try {
      return new Date(`2024-01-01T${time24}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return time24;
    }
  };

  // Filter businesses by search
  const filteredBusinesses = businesses.filter(biz =>
    biz.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isSuccess) {
    return (
      <div className="dashboard-container">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Appointment Successfully Booked</h2>
          <p>Confirmation has been sent to <strong>{formData.businessEmail}</strong></p>
          <div className="success-details">
            <div className="success-item">
              <Calendar size={16} />
              <span>{new Date(formData.date).toLocaleDateString()}</span>
            </div>
            <div className="success-item">
              <Clock size={16} />
              <span>{formatTimeFor12Hour(formData.time)}</span>
            </div>
            <div className="success-item">
              <Building2 size={16} />
              <span>{formData.service}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {customerName || 'Customer'}</h1>
          <p>Manage your appointments with ease</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}
          onClick={() => setActiveTab('booking')}
        >
          <Calendar size={20} />
          <span>Book Appointment</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <CalendarDays size={20} />
          <span>My Appointments</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === 'booking' && (
          <div className="booking-content">
            <div className="content-header">
              <h2>Book New Appointment</h2>
              <p>Fill in the details below to schedule your appointment</p>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="error-banner" style={{ 
                backgroundColor: '#fee2e2', 
                border: '1px solid #fecaca', 
                color: '#dc2626', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Working Hours Info */}
            {showWorkingHours && businessName && (
              <div className="working-hours-info" style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={16} />
                <span>
                  <strong>{businessName}</strong> is open from{' '}
                  <strong>{formatTimeFor12Hour(workingHours.start)}</strong> to{' '}
                  <strong>{formatTimeFor12Hour(workingHours.end)}</strong>
                </span>
              </div>
            )}

            {/* Business Search and Selection */}
            <div className="business-search-section" style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search salon name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="business-search-input"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  width: '100%',
                  maxWidth: '600px',
                  marginBottom: '12px'
                }}
              />
              <ul className="business-list" style={{
                listStyleType: 'none',
                padding: 0,
                margin: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff'
              }}>
                {filteredBusinesses.map(biz => (
                  <li key={biz.email} className="business-list-item" style={{
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong>{biz.businessName}</strong> ({biz.businessAddress})
                    </div>
                    <button 
                      onClick={() => setSelectedBusiness(biz)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {selectedBusiness && (
              <div className="selected-business-info" style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{selectedBusiness.businessName}</h3>
                <p style={{ margin: '4px 0', color: '#6b7280' }}>{selectedBusiness.businessAddress}</p>
                <div className="business-details-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '12px'
                }}>
                  <div className="business-detail-item" style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '14px' }}>{selectedBusiness.businessLocation}</span>
                  </div>
                  <div className="business-detail-item" style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '14px' }}>
                      {workingHours.start} - {workingHours.end}
                    </span>
                  </div>
                  <div className="business-detail-item" style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Mail size={16} />
                    <span style={{ fontSize: '14px' }}>{selectedBusiness.email}</span>
                  </div>
                  <div className="business-detail-item" style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Phone size={16} />
                    <span style={{ fontSize: '14px' }}>{selectedBusiness.phone}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>
                    <User size={16} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="customer-form-input"
                  />
                </div>

                <div className="customer-form-group">
                  <label>
                    <Phone size={16} />
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    name="customerPhone" 
                    value={formData.customerPhone} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="+1 (555) 123-4567"
                    className="customer-form-input"
                  />
                </div>

                <div className="customer-form-group customer-full-width">
                  <label>
                    <Mail size={16} />
                    Business Email *
                  </label>
                  <input 
                    type="email" 
                    name="businessEmail" 
                    value={formData.businessEmail} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="business@example.com"
                    className="customer-form-input"
                  />
                </div>

                <div className="customer-form-group customer-full-width">
                  <label>
                    <Building2 size={16} />
                    Service *
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                    disabled={services.length === 0}
                    className="customer-form-select"
                  >
                    <option value="">Select a service</option>
                    {services.map((service, index) => (
                      <option key={index} value={service}>{service}</option>
                    ))}
                  </select>
                  {serviceError && <span className="error-message" style={{ color: '#dc2626', fontSize: '14px' }}>{serviceError}</span>}
                </div>

                <div className="customer-form-group">
                  <label>
                    <Calendar size={16} />
                    Preferred Date *
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    min={getTodayDate()} 
                    max={getMaxDate()} 
                    required
                    className="customer-form-input"
                  />
                </div>

                <div className="customer-form-group">
                  <label>
                    <Clock size={16} />
                    Preferred Time *
                    {loadingBookedTimes && <Loader2 size={12} className="spinner inline-spinner" />}
                  </label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    disabled={loadingBookedTimes || availableTimeSlots.length === 0}
                    className="customer-form-select"
                  >
                    <option value="">
                      {loadingBookedTimes ? 'Loading available times...' : 
                       availableTimeSlots.length === 0 ? 'No available times' : 'Select time'}
                    </option>
                    {availableTimeSlots.map((slot, index) => {
                      const isBooked = bookedTimes.includes(slot.value);
                      return (
                        <option
                          key={index}
                          value={slot.value}
                          disabled={isBooked}
                          style={isBooked ? { 
                            color: '#ccc',
                            backgroundColor: '#f5f5f5'
                          } : {}}
                        >
                          {slot.label} {isBooked ? '(Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {availableTimeSlots.length > 0 && formData.service && formData.date && (
                    <small className="availability-info" style={{ color: '#6b7280', fontSize: '12px' }}>
                      {availableTimeSlots.length - bookedTimes.length} slots available out of {availableTimeSlots.length}
                    </small>
                  )}
                </div>

                <div className="customer-form-group customer-full-width">
                  <label>
                    <FileText size={16} />
                    Additional Notes
                  </label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    rows="3" 
                    placeholder="Any special requests or requirements..."
                    className="customer-form-textarea"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!isFormValid() || isSubmitting} 
                className="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Book Appointment
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments-content">
            <div className="content-header">
              <h2>My Appointments</h2>
              <p>Track your upcoming and past appointments</p>
            </div>

            <div className="appointments-grid">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>No appointments found</h3>
                  <p>Your scheduled appointments will appear here</p>
                </div>
              ) : (
                appointments.map(appointment => (
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
                        <span>{appointment.customerName}</span>
                      </div>
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>
                          {appointment.date
                            ? new Date(appointment.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'No date'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{formatTimeFor12Hour(appointment.time)}</span>
                      </div>
                      {appointment.notes && (
                        <div className="detail-item">
                          <FileText size={16} />
                          <span>{appointment.notes}</span>
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
    </div>
  );
};

export default CustomerDashboard;