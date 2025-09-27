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
  Navigation  // Add this import
} from 'lucide-react';
import { businessAPI, appointmentAPI } from '../utils/api';
import './CustomerDashboard.css';
import { useNavigate, Link } from 'react-router-dom';

// ADD THIS REUSABLE COMPONENT HERE
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

// Add this component after your RatingStars component
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

const CustomerDashboard = () => {
  // 1. State declarations
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

  // Add state for businesses and selected business
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [ratingModal, setRatingModal] = useState(null);
  const [userRating, setUserRating] = useState(0);

  const navigate = useNavigate();

  // 2. Utility functions (MOVE THESE UP)
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

  const getAvailableTimeSlots = () => {
    const allSlots = generateTimeSlots();
    const workingHoursSlots = allSlots.filter(slot => 
      isWithinWorkingHours(slot.value, workingHours.start, workingHours.end)
    );
    
    // If booking for today, filter out past times
    if (formData.date === getTodayDate()) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      return workingHoursSlots.filter(slot => {
        const [hours, minutes] = slot.value.split(':').map(num => parseInt(num, 10));
        const slotTime = hours * 60 + minutes;
        return slotTime > currentTime + 30; // Add 30 minutes buffer
      });
    }
    
    return workingHoursSlots;
  };

  // 3. useEffect hooks
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
        if (res.data.appointments) {
          // FETCH BUSINESS DETAILS for each appointment
          const appointmentsWithBusinessDetails = await Promise.all(
            res.data.appointments.map(async (appointment) => {
              try {
                // Fetch business details using business email
                const businessRes = await axios.get(`http://localhost:5000/api/businesses/email/${appointment.businessEmail}`);
                if (businessRes.data.success) {
                  return {
                    ...appointment,
                    businessName: businessRes.data.business.businessName,
                    businessAddress: businessRes.data.business.businessAddress,
                    businessPhone: businessRes.data.business.phone,
                    workingHours: businessRes.data.business.workingHours
                  };
                }
                return appointment;
              } catch (error) {
                console.error('Error fetching business details:', error);
                return appointment;
              }
            })
          );
          setAppointments(appointmentsWithBusinessDetails);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setAppointments([]);
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

  // 4. Event handlers
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
      businessName: business.businessName,      // ADD THIS
      businessAddress: business.businessAddress, // ADD THIS
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
        businessName: selectedBusiness?.businessName,     // ADD THIS
        businessAddress: selectedBusiness?.businessAddress, // ADD THIS
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
    if (userRating < 1 || userRating > 5 || !ratingModal) return;
    try {
      const response = await axios.post('http://localhost:5000/api/appointments/rate', {
        appointmentId: ratingModal._id,
        rating: userRating
      });
      if (response.data.success) {
        setAppointments(prev =>
          prev.map(appointment =>
            appointment._id === ratingModal._id
              ? { ...appointment, rating: userRating }
              : appointment
          )
        );
        setRatingModal(null);
        setUserRating(0);
      } else {
        console.error('Failed to submit rating:', response.data.message);
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

  const convertTo24Hour = (timeStr) => {
    try {
      if (!timeStr || typeof timeStr !== 'string') return '09:00';
      
      const cleanTime = timeStr.trim().replace(/\s+/g, ' ');
      
      if (!cleanTime.includes('AM') && !cleanTime.includes('PM')) {
        if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
          const [h, m] = cleanTime.split(':');
          const hour = parseInt(h, 10);
          if (hour >= 0 && hour <= 23) {
            return `${hour.toString().padStart(2, '0')}:${m}`;
          }
        }
        return '09:00';
      }
      
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

  // 3. useEffect hooks
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        let url = 'http://localhost:5000/api/businesses';
        if (selectedType) {
          url += `?type=${selectedType}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
          console.log('📊 Business data with ratings:', response.data.businesses);
          
          // Log each business's rating data for debugging
          response.data.businesses.forEach((biz, idx) => {
            console.log(`🏢 ${biz.businessName}:`, {
              averageRating: biz.averageRating || 0,
              totalRatings: biz.totalRatings || 0,
              hasRatings: (biz.averageRating > 0),
              ratingsArray: biz.ratings?.length || 0
            });
          });
          
          setBusinesses(response.data.businesses);
        } else {
          setBusinesses([]);
        }
      } catch (error) {
        console.log('Error fetching businesses:', error);
        setBusinesses([]);
      }
    };
    
    if (selectedType) {
      fetchBusinesses();
    }
  }, [selectedType]);

  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapAddress, setSelectedMapAddress] = useState('');
  const [selectedMapBusinessName, setSelectedMapBusinessName] = useState('');

  // Handle address click to show map - IMPROVED WITH ADDRESS VALIDATION
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

  // Open in external navigation apps
  const openInNavigationApp = (address) => {
    const encodedAddress = encodeURIComponent(address);
    
    // Try to detect device and open appropriate app
    const userAgent = navigator.userAgent.toLowerCase();
    let url;
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iOS - Apple Maps
      url = `https://maps.apple.com/?daddr=${encodedAddress}`;
    } else if (userAgent.includes('android')) {
      // Android - Google Maps
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    } else {
      // Desktop - Google Maps (CHANGED FROM OpenStreetMap)
      url = `https://www.google.com/maps/search/${encodedAddress}`;
    }
    
    window.open(url, '_blank');
  };

  // Initialize rating fields for businesses - ADD THIS FUNCTION
  const initializeRatingFields = () => {
    fetch('http://localhost:5000/api/businesses/init-rating-fields', {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      console.log('Rating fields initialized:', data);
      // Refresh the page after initialization
      window.location.reload();
    })
    .catch(error => {
      console.error('Error initializing rating fields:', error);
    });
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
          <h1>Welcome, {customerName || 'Customer'}</h1>
          <p>Manage your appointments with ease</p>
        </div>
      </div>

      {/* Navigation Tabs - REMOVED Browse Services Tab */}
      <div className="navigation-tabs">
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
        {/* ALWAYS SHOW DROPDOWN FIRST - NO TAB CONDITION */}
        {activeTab !== 'appointments' && (
          <div className="browse-content">
            <div className="content-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                Choose Your Appointment Type
              </h1>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                Select the type of service you're looking for and browse available providers
              </p>
            </div>

            {/* Business Type Filter - CENTERED AND PROMINENT */}
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

            {/* Businesses Grid - ONLY SHOW WHEN TYPE IS SELECTED */}
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
                    businesses.map(biz => (
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
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#1d4ed8';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#1e40af';
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

                          {/* Google-Style Rating Display */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            padding: '8px 0',
                            borderBottom: '1px solid #f1f5f9'
                          }}>
                            {biz.averageRating && biz.averageRating > 0 ? (
                              <>
                                {/* Rating Number */}
                                <span style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '600', 
                                  color: '#1f2937' 
                                }}>
                                  {parseFloat(biz.averageRating).toFixed(1)}
                                </span>
                                
                                {/* Stars */}
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '2px' 
                                }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span 
                                      key={star}
                                      style={{ 
                                        color: star <= Math.round(biz.averageRating) ? '#fbbf24' : '#e5e7eb',
                                        fontSize: '16px'
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Review Count */}
                                <span style={{ 
                                  fontSize: '14px', 
                                  color: '#1e40af',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}>
                                  {biz.totalRatings || 0} {(biz.totalRatings === 1) ? 'review' : 'reviews'}
                                </span>
                              </>
                            ) : (
                              <span style={{ 
                                fontSize: '14px', 
                                color: '#6b7280',
                                fontStyle: 'italic'
                              }}>
                                No reviews yet • Be the first to review
                              </span>
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
                            {/* ADD this new Route button */}
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments-content">
            <div className="content-header">
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
                My appointments
              </h2>
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
                  <div key={app._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    gap: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    {/* Professional Image */}
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
                          alt={app.service}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <User size={32} style={{ color: '#9ca3af' }} />
                      )}
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1 }}>
                      {/* Business Name & Service - FIXED */}
                      <h3 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#1f2937' 
                      }}>
                        {app.businessName || 'Business Name Not Available'}
                      </h3>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '14px', 
                        color: '#6b7280' 
                      }}>
                        {app.service}
                      </p>

                      {/* Address - FIXED */}
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
                            onClick={() => handleAddressClick(app.businessAddress, app.businessName)}
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

                      {/* Date & Time - FIXED */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '500' }}>Date & Time:</span>
                        <span>
                          {new Date(app.date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })} | {formatTimeFor12Hour(app.time)}
                        </span>
                      </div>
                    </div>

                    {/* Status & Actions - Same as before */}
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
                      {app.status === 'completed' && !app.rating && (
                        <button
                          onClick={() => setRatingModal(app)}
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
                      
                      {app.status === 'completed' && app.rating && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '2px' }}>
                            {'★'.repeat(app.rating)}{'☆'.repeat(5 - app.rating)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>
                            Rated {app.rating}/5
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

// Add this function after your other utility functions
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

export default CustomerDashboard;
