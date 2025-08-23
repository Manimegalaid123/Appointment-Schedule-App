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
  CalendarDays
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
    if (formData.businessEmail && formData.service && formData.date) {
      axios.get('http://localhost:5000/api/appointments/booked-times', {
        params: {
          businessEmail: formData.businessEmail,
          service: formData.service,
          date: formData.date
        }
      }).then(res => setBookedTimes(res.data.bookedTimes || []));
    } else {
      setBookedTimes([]);
    }
  }, [formData.businessEmail, formData.service, formData.date]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'businessEmail' && /\S+@\S+\.\S+/.test(value)) {
      await fetchBusinessServices(value);
    }
  };

  const fetchBusinessServices = async (email) => {
    setServices([]);
    setServiceError('');
    if (!email) return;
    try {
      const response = await businessAPI.getByEmail(email);
      if (response.success && response.business) {
        setServices(response.business.services || []);
      } else {
        setServiceError('Business not found or error fetching services.');
        setServices([]);
      }
    } catch (error) {
      setServiceError('Business not found or error fetching services.');
      setServices([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await appointmentAPI.create({
        ...formData,
        customerEmail,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setIsSuccess(true);
      // Refresh appointments list
      const response = await appointmentAPI.getAppointmentsByCustomer(customerEmail);
      if (response.success) setAppointments(response.appointments);
      
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
      }, 3000);
    } catch (error) {
      alert('Failed to submit appointment.');
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

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
    return {
      value: time,
      label: new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  });

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
              <span>{formData.time}</span>
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
                  {serviceError && <span className="error-message">{serviceError}</span>}
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
                  </label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="customer-form-select"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((slot, index) => (
                      <option
                        key={index}
                        value={slot.value}
                        disabled={bookedTimes.includes(slot.value)}
                        style={bookedTimes.includes(slot.value) ? { color: '#ccc' } : {}}
                      >
                        {slot.label}
                      </option>
                    ))}
                  </select>
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
                        <span>{appointment.time}</span>
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