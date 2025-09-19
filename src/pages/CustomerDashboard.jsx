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
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const customerName = localStorage.getItem('name');
  const customerEmail = localStorage.getItem('email');
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
  const [selectedType, setSelectedType] = useState('');
  // const [searchQuery, setSearchQuery] = useState('');

  const [ratingModal, setRatingModal] = useState(null);
  const [userRating, setUserRating] = useState(0);

  const navigate = useNavigate();

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

  const handleRatingSubmit = async () => {
    if (userRating < 1 || userRating > 5) return;

    try {
      const response = await appointmentAPI.rateAppointment(ratingModal._id, userRating);
      if (response.success) {
        setAppointments(prev => 
          prev.map(appointment => 
            appointment._id === ratingModal._id ? { ...appointment, rating: userRating } : appointment
          )
        );
        setRatingModal(null);
        setUserRating(0);
      } else {
        console.error('Failed to submit rating:', response.message);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
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

  useEffect(() => {
    if (!selectedType) {
      setBusinesses([]);
      return;
    }
    const fetchBusinesses = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/businesses?type=${selectedType}`);
        if (response.data.success) setBusinesses(response.data.businesses);
        else setBusinesses([]);
      } catch (error) {
        setBusinesses([]);
      }
    };
    fetchBusinesses();
  }, [selectedType]);

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
          <h1>Welcome, {customerName || customerEmail || 'Customer'}</h1>
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

            {/* Business Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label>
                Choose Business Type:&nbsp;
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="salon">Salon</option>
                  <option value="doctor">Doctor</option>
                  <option value="consultant">Consultant</option>
                  {/* Add more types as needed */}
                </select>
              </label>
            </div>

            {/* Show businesses as cards for selected type */}
            {selectedType && (
              <div>
                {businesses.length === 0 && <p>No businesses found for this type.</p>}
                {businesses.map(biz => (
                  <div key={biz._id} className="shop-card" style={{ border: '1px solid #eee', padding: 16, marginBottom: 12, borderRadius: 8 }}>
                    <h3>{biz.businessName}</h3>
                    <p>{biz.businessAddress}</p>
                    <button onClick={() => navigate(`/salon/${biz._id}`)}>View Details</button>
                  </div>
                ))}
              </div>
            )}

            {/* Show selected business details and booking form */}
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
                {/* Add more business details here if needed */}
                <button onClick={() => setSelectedBusiness(null)} style={{ marginBottom: 16 }}>Back to List</button>
                {/* Booking form below */}
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
                        placeholder="Any additional information or requests"
                        className="customer-form-textarea"
                      />
                    </div>

                    <div className="customer-form-group customer-full-width">
                      <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isSubmitting || !isFormValid()}
                        style={{ 
                          backgroundColor: isSubmitting ? '#d1fae5' : '#10b981',
                          color: isSubmitting ? '#6b7280' : '#fff',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isSubmitting ? <Loader2 size={16} className="spinner" /> : 'Book Appointment'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments-content">
            <div className="content-header">
              <h2>My Appointments</h2>
              <p>View and manage your upcoming appointments</p>
            </div>

            {appointments.length === 0 ? (
              <div className="no-appointments" style={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280' }}>You have no upcoming appointments.</p>
                <Link to="/book" className="book-now-button" style={{ 
                  display: 'inline-block', 
                  marginTop: '12px', 
                  padding: '10px 20px', 
                  backgroundColor: '#10b981', 
                  color: '#fff', 
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}>
                  Book Now
                </Link>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map(appointment => (
                  <div key={appointment._id} className="appointment-card" style={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '16px',
                    marginBottom: '12px',
                    position: 'relative'
                  }}>
                    <div className="appointment-details" style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px'
                    }}>
                      <div className="appointment-header" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                      }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          color: '#111827'
                        }}>
                          {appointment.service}
                        </h3>
                        <span style={{ 
                          fontSize: '14px', 
                          color: getStatusColor(appointment.status),
                          fontWeight: '500'
                        }}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      <div className="appointment-time" style={{ 
                        display: 'flex', 
                        gap: '8px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={16} />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={16} />
                          <span>{formatTimeFor12Hour(appointment.time)}</span>
                        </div>
                      </div>
                      <div className="appointment-business" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        <Building2 size={16} />
                        <span>{appointment.businessName}</span>
                      </div>
                      {appointment.businessAddress && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          <MapPin size={14} /> {appointment.businessAddress}
                        </div>
                      )}
                      {appointment.businessPhone && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          <Phone size={14} /> {appointment.businessPhone}
                        </div>
                      )}
                    </div>

                    <div className="appointment-actions" style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: '8px',
                      marginTop: '12px'
                    }}>
                      <button 
                        onClick={() => handleReschedule(appointment._id, appointment.date, appointment.time)}
                        className="reschedule-button"
                        style={{ 
                          backgroundColor: '#3b82f6', 
                          color: '#fff', 
                          padding: '8px 16px', 
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Clock size={16} />
                        Reschedule
                      </button>
                      <button 
                        onClick={() => handleCancel(appointment._id)}
                        className="cancel-button"
                        style={{ 
                          backgroundColor: '#ef4444', 
                          color: '#fff', 
                          padding: '8px 16px', 
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash size={16} />
                        Cancel
                      </button>
                    </div>

                    {/* Rating section */}
                    {appointment.status === 'completed' && !appointment.rating && (
                      <div className="rating-prompt" style={{ 
                        marginTop: '12px', 
                        padding: '8px', 
                        backgroundColor: '#f0f9ff', 
                        border: '1px solid #bfdbfe', 
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#111827' }}>
                          Rate your experience with {appointment.service}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              style={{ 
                                fontSize: 28, 
                                color: userRating >= star ? '#fbbf24' : '#d1d5db', 
                                cursor: 'pointer' 
                              }}
                              onClick={() => setUserRating(star)}
                            >★</span>
                          ))}
                        </div>
                        <button 
                          onClick={handleRatingSubmit}
                          className="submit-rating-button"
                          style={{ 
                            marginTop: '8px', 
                            padding: '8px 16px', 
                            backgroundColor: '#10b981', 
                            color: '#fff', 
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Submit Rating
                        </button>
                      </div>
                    )}
                    {appointment.rating && (
                      <div className="rating-display" style={{ 
                        marginTop: '12px', 
                        fontSize: '14px', 
                        color: '#374151' 
                      }}>
                        Your Rating: {renderStars(appointment.rating)} {appointment.rating}/5
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
