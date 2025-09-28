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
  Info,
  Navigation
} from 'lucide-react';
import { businessAPI, appointmentAPI } from '../utils/api';
import './CustomerDashboard.css';
import { useNavigate, Link } from 'react-router-dom';

// Utility Components
const RatingStars = ({ rating, totalRatings, size = 16 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <div style={{ display: 'flex', color: '#fbbf24', fontSize: `${size}px` }}>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '★'}
        {'☆'.repeat(emptyStars)}
      </div>
      <span style={{ 
        fontSize: `${size - 2}px`, 
        fontWeight: '600', 
        color: '#047857' 
      }}>
        {rating.toFixed(1)}
      </span>
      <span style={{ 
        fontSize: `${size - 4}px`, 
        color: '#6b7280' 
      }}>
        ({totalRatings})
      </span>
    </div>
  );
};

const DateWarning = ({ message }) => (
  <div style={{
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px',
    margin: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span style={{ fontSize: '16px' }}>⚠️</span>
    <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
      {message}
    </span>
  </div>
);

// Utility Functions
const formatTimeFor12Hour = (time24) => {
  try {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    return time24;
  }
};

const CustomerDashboard = () => {
  // State declarations
  const [customerName, setCustomerName] = useState('');
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
  const [businesses, setBusinesses] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [loadingBookedTimes, setLoadingBookedTimes] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '19:00' });
  const [businessName, setBusinessName] = useState('');
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [ratingModal, setRatingModal] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [businessReviews, setBusinessReviews] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});

  const navigate = useNavigate();

  // Utility functions
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const isDateInPast = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(dateString);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate < today;
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (isDateInPast(selectedDate)) {
      setBookingError('❌ Cannot book appointments for past dates. Please select today or a future date.');
      setFormData(prev => ({ ...prev, date: '', time: '' }));
      return;
    }
    
    setBookingError('');
    setFormData(prev => ({ ...prev, date: selectedDate, time: '' }));
  };

  const fetchBusinessServices = async (businessEmail) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/businesses/email/${businessEmail}`);
      if (response.data.success) {
        const business = response.data.business;
        setServices(business.services || []);
        setBusinessName(business.businessName || '');
        setWorkingHours({
          start: business.workingHours?.start || '09:00',
          end: business.workingHours?.end || '19:00'
        });
        setShowWorkingHours(true);
      }
    } catch (error) {
      console.error('Error fetching business services:', error);
      setServices([]);
      setServiceError('Failed to load services for this business.');
    }
  };

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
      return true;
    }
  };

  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots();
    const workingHoursSlots = allSlots.filter(slot => 
      isWithinWorkingHours(slot.value, workingHours.start, workingHours.end)
    );
    
    if (formData.date === getTodayDate()) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      return workingHoursSlots.filter(slot => {
        const [hours, minutes] = slot.value.split(':').map(num => parseInt(num, 10));
        const slotTime = hours * 60 + minutes;
        return slotTime > currentTime + 30;
      });
    }
    
    return workingHoursSlots;
  };

  // Event handlers
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setBookingError('');

    if (name === 'businessEmail' && /\S+@\S+\.\S+/.test(value)) {
      await fetchBusinessServices(value);
    }

    if (name === 'service' || name === 'date') {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  };

  const handleServiceSelect = (business, service) => {
    setSelectedBusiness(business);
    setFormData(prev => ({
      ...prev,
      businessEmail: business.email,
      businessName: business.businessName,
      businessAddress: business.businessAddress,
      service: service,
      date: '',
      time: '',
      notes: ''
    }));
    fetchBusinessServices(business.email);
    setShowBookingForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingError('');
    
    try {
      const response = await appointmentAPI.create({
        ...formData,
        customerEmail,
        businessName: selectedBusiness?.businessName,
        businessAddress: selectedBusiness?.businessAddress,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      if (response.data && response.data.success) {
        setIsSuccess(true);
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
          setShowBookingForm(false);
          setSelectedBusiness(null);
        }, 3000);
      } else {
        setBookingError(response.data?.message || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error.response?.data?.message) {
        setBookingError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setBookingError('This time slot is already booked. Please select a different time.');
      } else {
        setBookingError('Failed to book appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (userRating < 1 || userRating > 5 || !ratingModal) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/appointments/rate', {
        appointmentId: ratingModal._id,
        rating: userRating,
        comment: ''
      });

      if (response.data.success) {
        setAppointments(prev =>
          prev.map(appointment =>
            appointment._id === ratingModal._id
              ? { 
                  ...appointment, 
                  rating: {
                    rating: userRating,
                    comment: '',
                    ratedAt: new Date()
                  }
                }
              : appointment
          )
        );

        alert(`✅ Thank you! You rated this service ${userRating} star${userRating !== 1 ? 's' : ''}.`);
        setRatingModal(null);
        setUserRating(0);
      } else {
        alert('❌ Failed to submit rating: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      alert(`❌ Failed to submit rating: ${error.response?.data?.message || 'Server error'}`);
    }
  };

  const fetchBusinessReviews = async (businesses) => {
    const reviewsData = {};
    
    await Promise.all(
      businesses.map(async (business) => {
        try {
          const response = await axios.get(`http://localhost:5000/api/appointments/ratings/${business.email}`);
          if (response.data.success) {
            reviewsData[business._id] = response.data.allReviews || [];
          }
        } catch (error) {
          console.error(`Error fetching reviews for ${business.businessName}:`, error);
          reviewsData[business._id] = [];
        }
      })
    );
    
    setBusinessReviews(reviewsData);
  };

  const handleAppointmentClick = async (appointment) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/businesses/email/${appointment.businessEmail}`);
      
      if (response.data.success) {
        const business = response.data.business;
        navigate(`/salon/${business._id}`);
      } else {
        alert(`Appointment Details:\n\nBusiness: ${appointment.businessName || 'Unknown'}\nService: ${appointment.service}\nDate: ${new Date(appointment.date).toLocaleDateString()}\nTime: ${formatTimeFor12Hour(appointment.time)}\nStatus: ${appointment.status.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
      alert(`Appointment Details:\n\nBusiness: ${appointment.businessName || 'Unknown'}\nService: ${appointment.service}\nDate: ${new Date(appointment.date).toLocaleDateString()}\nTime: ${formatTimeFor12Hour(appointment.time)}\nStatus: ${appointment.status.toUpperCase()}`);
    }
  };

  const handleAddressClick = (address, businessName) => {
    if (!address || address === 'N/A' || address.trim() === '') {
      alert('Address not available for this business');
      return;
    }
    
    const confirmed = confirm(
      `Open ${businessName} location in maps?\n\nAddress: ${address}\n\nClick OK to open in maps app`
    );
    
    if (confirmed) {
      openInNavigationApp(address);
    }
  };

  const openInNavigationApp = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const userAgent = navigator.userAgent.toLowerCase();
    let url;
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      url = `https://maps.apple.com/?daddr=${encodedAddress}`;
    } else if (userAgent.includes('android')) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    } else {
      url = `https://www.google.com/maps/search/${encodedAddress}`;
    }
    
    window.open(url, '_blank');
  };

  // useEffect hooks
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
        const res = await axios.get(`http://localhost:5000/api/appointments/customer/${customerEmail}`);
        
        if (res.data.success && res.data.appointments) {
          const appointmentsData = res.data.appointments.map(appointment => ({
            ...appointment,
            businessName: appointment.businessName || appointment.businessEmail || 'Business Name Not Available',
            businessAddress: appointment.businessAddress || 'Address not available',
            businessPhone: appointment.businessPhone || 'Phone not available',
            workingHours: appointment.workingHours || '9:00 AM - 6:00 PM'
          }));
          
          setAppointments(appointmentsData);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error('❌ Error fetching appointments:', err);
        setAppointments([]);
      }
    };

    if (customerEmail) {
      fetchAppointments();
    }
  }, [customerEmail]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      customerName: customerName || ''
    }));
  }, [customerName]);

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

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        let url = 'http://localhost:5000/api/businesses';
        if (selectedType) {
          url += `?type=${selectedType}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
          const businessesData = response.data.businesses;
          setBusinesses(businessesData);
          
          if (businessesData.length > 0) {
            await fetchBusinessReviews(businessesData);
          }
        } else {
          setBusinesses([]);
          setBusinessReviews({});
        }
      } catch (error) {
        console.log('Error fetching businesses:', error);
        setBusinesses([]);
        setBusinessReviews({});
      }
    };
    
    if (selectedType) {
      fetchBusinesses();
    }
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
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div className="dashboard-container" style={{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div className="dashboard-header" style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <div className="welcome-section">
            <h1>Welcome, {customerName || 'Customer'}</h1>
            <p>Manage your appointments with ease</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="navigation-tabs" style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto 32px auto',
          boxSizing: 'border-box'
        }}>
          <button 
            className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <CalendarDays size={20} />
            <span>My Appointments</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="content-area" style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {/* Browse Services Tab */}
          {activeTab === 'browse' && (
            <div className="browse-content">
              <div className="content-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                  Choose Your Appointment Type
                </h1>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>
                  Select the type of service you're looking for and browse available providers
                </p>
              </div>

              {/* Business Type Filter */}
              <div style={{ 
                marginBottom: '40px', 
                textAlign: 'center',
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxWidth: '600px',
                margin: '0 auto 40px auto'
              }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '16px', 
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Choose Business Type:
                </label>
                <select 
                  value={selectedType} 
                  onChange={e => setSelectedType(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '16px 20px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Select Type --</option>
                  <option value="salon">Salon</option>
                  <option value="doctor">Doctor</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>

              {/* No Selection State */}
              {!selectedType && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <Building2 size={64} style={{ marginBottom: '16px', opacity: 0.5, margin: '0 auto 16px auto' }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Select a Service Type</h3>
                  <p style={{ margin: 0 }}>Choose from Salon, Doctor, or Consultant to see available providers</p>
                </div>
              )}

              {/* Businesses Grid */}
              {selectedType && (
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                    Available {selectedType === 'salon' ? 'Salons' : 
                              selectedType === 'doctor' ? 'Doctors' : 
                              selectedType === 'consultant' ? 'Consultants' : 'Services'} ({businesses.length})
                  </h2>
                  
                  <div className="businesses-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px',
                    marginTop: '20px'
                  }}>
                    {businesses.length === 0 ? (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}>
                        <Building2 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#374151' }}>
                          No {selectedType === 'salon' ? 'Salons' : 
                              selectedType === 'doctor' ? 'Doctors' : 
                              selectedType === 'consultant' ? 'Consultants' : 'Businesses'} Found
                        </h3>
                        <p style={{ margin: 0, color: '#6b7280' }}>
                          No registered {selectedType}s available at the moment.
                        </p>
                      </div>
                    ) : (
                      businesses.map(biz => {
                        const businessReviewsList = businessReviews[biz._id] || [];
                        
                        return (
                          <div key={biz._id} className="business-card" style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}>
                            {/* Business Image */}
                            <div style={{
                              width: '100%',
                              height: '200px',
                              position: 'relative',
                              overflow: 'hidden',
                              backgroundColor: '#f9fafb'
                            }}>
                              {biz.imageUrl ? (
                                <img
                                  src={`http://localhost:5000${biz.imageUrl}`}
                                  alt={biz.businessName}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: biz.imageUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f3f4f6',
                                color: '#9ca3af'
                              }}>
                                <Building2 size={48} />
                              </div>
                            </div>

                            {/* Business Info */}
                            <div style={{ padding: '20px' }}>
                              <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1f2937'
                              }}>
                                {biz.businessName}
                              </h3>
                              
                              {/* Address */}
                              <div 
                                onClick={() => handleAddressClick(biz.businessAddress, biz.businessName)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '6px',
                                  color: '#1e40af',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s',
                                  textDecoration: 'underline'
                                }}
                              >
                                <MapPin size={14} style={{ marginRight: '6px', flexShrink: 0 }} />
                                <span>{biz.businessAddress}</span>
                                <Navigation size={12} style={{ marginLeft: '4px' }} />
                              </div>
                              
                              {/* Phone */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '6px',
                                color: '#6b7280',
                                fontSize: '14px'
                              }}>
                                <Phone size={14} style={{ marginRight: '6px' }} />
                                <span>{biz.phone || 'Phone not available'}</span>
                              </div>
                              
                              {/* Working Hours */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '12px',
                                color: '#6b7280',
                                fontSize: '14px'
                              }}>
                                <Clock size={14} style={{ marginRight: '6px' }} />
                                <span>{biz.workingHours || '9:00 AM - 7:00 PM'}</span>
                              </div>

                              {/* SINGLE Reviews Section - Google Style */}
                              <div style={{
                                marginBottom: '16px',
                                padding: '12px 0',
                                borderBottom: '1px solid #f1f5f9'
                              }}>
                                {businessReviewsList.length > 0 ? (
                                  (() => {
                                    const totalRating = businessReviewsList.reduce((sum, review) => sum + review.rating, 0);
                                    const averageRating = totalRating / businessReviewsList.length;
                                    const isExpanded = expandedReviews[biz._id];
                                    
                                    return (
                                      <div>
                                        {/* Rating Summary - Always Visible */}
                                        <div 
                                          onClick={() => setExpandedReviews(prev => ({
                                            ...prev,
                                            [biz._id]: !prev[biz._id]
                                          }))}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            transition: 'background-color 0.2s',
                                            backgroundColor: isExpanded ? '#f8fafc' : 'transparent'
                                          }}
                                          onMouseOver={(e) => {
                                            if (!isExpanded) e.target.style.backgroundColor = '#f8fafc';
                                          }}
                                          onMouseOut={(e) => {
                                            if (!isExpanded) e.target.style.backgroundColor = 'transparent';
                                          }}
                                        >
                                          <span style={{ 
                                            fontSize: '24px', 
                                            fontWeight: '700', 
                                            color: '#1f2937' 
                                          }}>
                                            {averageRating.toFixed(1)}
                                          </span>
                                          
                                          <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '4px' 
                                          }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <span 
                                                key={star}
                                                style={{ 
                                                  color: star <= Math.round(averageRating) ? '#fbbf24' : '#e5e7eb',
                                                  fontSize: '20px'
                                                }}
                                              >
                                                ★
                                              </span>
                                            ))}
                                          </div>
                                          
                                          <span style={{ 
                                            fontSize: '14px', 
                                            color: '#1e40af',
                                            fontWeight: '500',
                                            textDecoration: 'underline'
                                          }}>
                                            {businessReviewsList.length} {businessReviewsList.length === 1 ? 'review' : 'reviews'}
                                          </span>

                                          {/* Expand/Collapse Icon */}
                                          <div style={{
                                            marginLeft: 'auto',
                                            fontSize: '16px',
                                            color: '#6b7280',
                                            transition: 'transform 0.2s',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                          }}>
                                            ▼
                                          </div>
                                        </div> {/* This should close the main rating summary div */}

                                        {/* Expandable Reviews Container */}
                                        {isExpanded && (
                                          <div 
                                            style={{
                                              marginTop: '12px',
                                              maxHeight: '400px',
                                              overflowY: 'auto',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '12px',
                                              backgroundColor: '#fafafa',
                                              animation: 'slideDown 0.3s ease-out'
                                            }}
                                          >
                                            {businessReviewsList.map((review, idx) => (
                                              <div
                                                key={idx}
                                                style={{
                                                  padding: '16px',
                                                  borderBottom: idx < businessReviewsList.length - 1 ? '1px solid #e5e7eb' : 'none',
                                                  backgroundColor: 'white',
                                                  margin: '8px',
                                                  borderRadius: '8px',
                                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                }}
                                              >
                                                {/* Review Header */}
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'flex-start',
                                                  gap: '12px',
                                                  marginBottom: '8px'
                                                }}>
                                                  {/* Customer Avatar */}
                                                  <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '16px',
                                                    flexShrink: 0
                                                  }}>
                                                    {review.customerName?.charAt(0) || 'C'}
                                                  </div>

                                                  {/* Review Content */}
                                                  <div style={{ flex: 1 }}>
                                                    {/* Customer Name & Date */}
                                                    <div style={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'space-between',
                                                      marginBottom: '6px'
                                                    }}>
                                                      <h4 style={{
                                                        margin: 0,
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: '#1f2937'
                                                      }}>
                                                        {review.customerName || 'Customer'}
                                                      </h4>
                                                      <span style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280'
                                                      }}>
                                                        {review.daysAgo !== undefined ? 
                                                          `${review.daysAgo === 0 ? 'Today' : `${review.daysAgo} days ago`}` :
                                                          new Date(review.ratedAt).toLocaleDateString()
                                                        }
                                                      </span>
                                                    </div>

                                                    {/* Rating Stars */}
                                                    <div style={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: '8px',
                                                      marginBottom: '8px'
                                                    }}>
                                                      <div style={{ display: 'flex', color: '#fbbf24', fontSize: '14px' }}>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                          <span 
                                                            key={star}
                                                            style={{ 
                                                              color: star <= review.rating ? '#fbbf24' : '#e5e7eb'
                                                            }}
                                                          >
                                                            ★
                                                          </span>
                                                        ))}
                                                      </div>
                                                      <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: '#059669',
                                                        background: '#f0fdf4',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px'
                                                      }}>
                                                        {review.rating}/5
                                                      </span>
                                                    </div>

                                                    {/* Service Tag */}
                                                    <div style={{
                                                      display: 'inline-block',
                                                      fontSize: '12px',
                                                      color: '#7c3aed',
                                                      background: '#f3e8ff',
                                                      padding: '4px 8px',
                                                      borderRadius: '12px',
                                                      fontWeight: '500',
                                                      marginBottom: '8px',
                                                      border: '1px solid #e9d5ff'
                                                    }}>
                                                      💄 {review.service}
                                                    </div>

                                                    {/* Review Text */}
                                                    {review.notes && (
                                                      <p style={{
                                                        margin: 0,
                                                        fontSize: '14px',
                                                        color: '#374151',
                                                        lineHeight: '1.5',
                                                        background: '#f8fafc',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        fontStyle: 'italic'
                                                      }}>
                                                        "{review.notes}"
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}

                                            {/* Footer */}
                                            <div style={{
                                              padding: '12px',
                                              textAlign: 'center',
                                              backgroundColor: '#f9fafb',
                                              borderTop: '1px solid #e5e7eb'
                                            }}>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigate(`/salon/${biz._id}`);
                                                }}
                                                style={{
                                                  fontSize: '14px',
                                                  color: '#1e40af',
                                                  background: 'none',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  fontWeight: '600',
                                                  padding: '8px 16px',
                                                  borderRadius: '6px',
                                                  transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#eff6ff'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                              >
                                                View Business Details →
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: '#6b7280',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>No reviews yet</p>
                                    <p style={{ margin: 0, fontSize: '12px' }}>Be the first to review this business!</p>
                                  </div>
                                )}
                              </div>

                              {/* Services - Now clickable */}
                              {biz.services && biz.services.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                  <p style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#4b5563'
                                  }}>
                                    Services Available (Click to Book):
                                  </p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {biz.services.map((service, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleServiceSelect(biz, service)}
                                        style={{
                                          backgroundColor: '#eff6ff',
                                          color: '#1e40af',
                                          padding: '4px 8px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          fontWeight: '500',
                                          border: 'none',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => {
                                          e.target.style.backgroundColor = '#dbeafe';
                                          e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseOut={(e) => {
                                          e.target.style.backgroundColor = '#eff6ff';
                                          e.target.style.transform = 'scale(1)';
                                        }}
                                      >
                                        {service}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => navigate(`/salon/${biz._id}`)}
                                  style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={() => openInNavigationApp(biz.businessAddress)}
                                  style={{
                                    padding: '10px 12px',
                                    border: '1px solid #10b981',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Navigation size={14} />
                                  Route
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="appointments-content">
              {/* Add back button at the top of appointments content */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <div className="content-header">
                  <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    My appointments
                  </h2>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="no-appointments" style={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <CalendarDays size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                  <h3 style={{ color: '#374151', marginBottom: '8px' }}>No appointments yet</h3>
                  <p style={{ color: '#6b7280', marginBottom: '20px' }}>Book your first appointment to get started</p>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#3b82f6', 
                      color: '#fff', 
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Browse Services
                  </button>
                </div>
              ) : (
                <div className="appointments-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {appointments.map(app => (
                    <div 
                      key={app._id} 
                      onClick={() => handleAppointmentClick(app)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        gap: '20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {app.serviceImageUrl ? (
                          <img
                            src={app.serviceImageUrl}
                            alt={app.service || 'Service'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={32} style={{ color: '#9ca3af' }} />
                        )}
                      </div>

                      {/* Main Content */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#1f2937' 
                        }}>
                          {app.businessName || app.businessEmail || 'Business Name Not Available'}
                        </h3>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          fontSize: '14px', 
                          color: '#6b7280' 
                        }}>
                          {app.service || 'Service not specified'}
                        </p>

                        {/* Address */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#6b7280',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontWeight: '500' }}>Address:</span>
                          {app.businessAddress && app.businessAddress !== 'Address not available' ? (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddressClick(app.businessAddress, app.businessName);
                              }}
                              style={{
                                color: '#1e40af',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              {app.businessAddress}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>Address not available</span>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#6b7280',
                          fontSize: '14px'
                        }}>
                          <span style={{ fontWeight: '500' }}>Date & Time:</span>
                          <span>
                            {app.date ? new Date(app.date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 'Date not available'} | {app.time ? formatTimeFor12Hour(app.time) : 'Time not available'}
                          </span>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end', 
                        gap: '8px',
                        minWidth: '120px'
                      }}>
                        {/* Status Badge */}
                        {app.status === 'pending' && (
                          <span style={{ 
                            backgroundColor: '#fef3c7', 
                            color: '#d97706', 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600'
                          }}>
                            PENDING
                          </span>
                        )}
                        {app.status === 'accepted' && (
                          <span style={{ 
                            backgroundColor: '#d1fae5', 
                            color: '#059669', 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600'
                          }}>
                            CONFIRMED
                          </span>
                        )}
                        {app.status === 'completed' && (
                          <span style={{ 
                            backgroundColor: '#dbeafe', 
                            color: '#1d4ed8', 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600'
                          }}>
                            COMPLETED
                          </span>
                        )}
                        {app.status === 'cancelled' && (
                          <span style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626', 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600'
                          }}>
                            CANCELLED
                          </span>
                        )}

                        {/* Rating Action */}
                        {app.status === 'completed' && (!app.rating || !app.rating.rating) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRatingModal(app);
                            }}
                            style={{
                              backgroundColor: '#eff6ff',
                              border: '1px solid #3b82f6',
                              color: '#3b82f6',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Rate Service
                          </button>
                        )}
                        
                        {app.status === 'completed' && app.rating && app.rating.rating && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '2px' }}>
                              {'★'.repeat(app.rating.rating)}{'☆'.repeat(5 - app.rating.rating)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>
                              Rated {app.rating.rating}/5
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            width: '450px',
            maxWidth: '90vw'
          }}>
            {/* Completion Confirmation */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #10b981',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <span style={{ fontSize: '24px' }}>✅</span>
              </div>
              <h2 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Service Completed!</h2>
              <p style={{ margin: 0, color: '#6b7280' }}>
                How was your experience with <strong>{ratingModal.service}</strong>?
              </p>
            </div>

            {/* Service Details */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={ratingModal.serviceImageUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=60&h=60"}
                  alt={ratingModal.service}
                  style={{ width: 50, height: 50, borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1f2937' }}>
                    {ratingModal.service}
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    📅 {ratingModal.date} | ⏰ {ratingModal.time}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                    ✅ Service completed successfully
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Stars */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#374151' }}>
                Rate your overall experience:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '32px',
                      cursor: 'pointer',
                      color: star <= userRating ? '#fbbf24' : '#d1d5db',
                      transition: 'all 0.2s',
                      transform: star <= userRating ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                {userRating === 1 && '😞 Poor - Service needs improvement'}
                {userRating === 2 && '😐 Fair - Below expectations'}
                {userRating === 3 && '😊 Good - Satisfactory service'}
                {userRating === 4 && '😃 Very Good - Great experience'}
                {userRating === 5 && '🤩 Excellent - Outstanding service!'}
                {userRating === 0 && 'Click on stars to rate'}
              </p>
            </div>

            {/* Helper Text */}
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', textAlign: 'center' }}>
                💡 Your rating helps other customers and improves service quality
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setRatingModal(null);
                  setUserRating(0);
                }}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={userRating === 0}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: userRating > 0 ? '#10b981' : '#d1d5db',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: userRating > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {userRating > 0 ? `Submit ${userRating}-Star Rating` : 'Select Rating First'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add this helpful message near your date input */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '12px',
        margin: '8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16px' }}>💡</span>
        <span style={{ fontSize: '14px', color: '#1e40af' }}>
          {formData.date === getTodayDate() 
            ? 'Booking for today - only future time slots are available'
            : 'Select your preferred date and time for the appointment'
          }
        </span>
      </div>
    </div>
  );
};

export default CustomerDashboard;
