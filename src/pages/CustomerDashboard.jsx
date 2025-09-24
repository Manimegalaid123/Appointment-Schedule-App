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

const CustomerDashboard = () => {
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
  const [activeTab, setActiveTab] = useState('browse');
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
  const [showBookingForm, setShowBookingForm] = useState(false);

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
        const res = await axios.get(`http://localhost:5000/api/appointments/customer/${customerEmail}`);
        setAppointments(res.data.appointments || []);
      } catch (err) {
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

        setServices(business.services || []);
        setBusinessName(business.businessName || business.name || 'Business');

        const normalizeTimeString = (str) => {
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

  const handleServiceSelect = (business, service) => {
    setSelectedBusiness(business);
    setFormData(prev => ({
      ...prev,
      businessEmail: business.email,
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

  const allTimeSlots = generateTimeSlots();
  
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
    const fetchBusinesses = async () => {
      try {
        let url = 'http://localhost:5000/api/businesses';
        if (selectedType) {
          url += `?type=${selectedType}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
          setBusinesses(response.data.businesses);
        } else {
          setBusinesses([]);
        }
      } catch (error) {
        setBusinesses([]);
      }
    };
    fetchBusinesses();
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
                          
                          {/* REPLACE the existing address div with this CLICKABLE one: */}
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
              <h2>My Appointments</h2>
              <p>View and manage your upcoming appointments</p>
            </div>

            {appointments.length === 0 ? (
              <div className="no-appointments" style={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: 16,
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280' }}>You have no upcoming appointments.</p>
                <button 
                  onClick={() => setActiveTab('browse')}
                  className="book-now-button" 
                  style={{ 
                    display: 'inline-block', 
                    marginTop: '12px', 
                    padding: '10px 20px', 
                    backgroundColor: '#10b981', 
                    color: '#fff', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Browse Salons
                </button>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map(app => (
                  <div key={app._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    gap: 24
                  }}>
                    <img
                      src={app.serviceImageUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=120&h=120"}
                      alt={app.service}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, background: '#f3f4f6' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 18 }}>{app.service}</div>
                      {/* REPLACE existing address div with this CLICKABLE one: */}
                      <div 
                        onClick={() => handleAddressClick(app.businessAddress || 'N/A', app.businessName || 'Business')}
                        style={{ 
                          color: '#1e40af', 
                          fontSize: 15,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          margin: '4px 0'
                        }}
                      >
                        <MapPin size={14} />
                        <b>Address:</b> {app.businessAddress || 'N/A'}
                        <Navigation size={12} />
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 15 }}>
                        <b>Date & Time:</b> {app.date} | {app.time}
                      </div>
                    </div>
                    <div>
                      {app.status === 'cancelled' && (
                        <button style={{ color: '#ef4444', border: '1px solid #ef4444', background: '#fff', borderRadius: 6, padding: '6px 12px' }}>
                          Cancelled
                        </button>
                      )}
                      {app.status === 'pending' && (
                        <button style={{ color: '#f59e0b', border: '1px solid #f59e0b', background: '#fff', borderRadius: 6, padding: '6px 12px' }}>
                          Pending
                        </button>
                      )}
                      {app.status === 'accepted' && (
                        <button style={{ color: '#10b981', border: '1px solid #10b981', background: '#fff', borderRadius: 6, padding: '6px 12px' }}>
                          Accepted
                        </button>
                      )}
                      {app.status === 'completed' && !app.rating && (
                        <button
                          style={{ color: '#6366f1', border: '1px solid #6366f1', background: '#fff', borderRadius: 6, padding: '6px 12px' }}
                          onClick={() => setRatingModal(app)}
                        >
                          Rate this service
                        </button>
                      )}
                      {app.status === 'completed' && app.rating && (
                        <div>
                          Your Rating: {'★'.repeat(app.rating)}{'☆'.repeat(5 - app.rating)} ({app.rating}/5)
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
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>Rate Your Experience</h3>
            <p>How was your experience with {ratingModal.service}?</p>
            <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: star <= userRating ? '#fbbf24' : '#d1d5db'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setRatingModal(null);
                  setUserRating(0);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={userRating === 0}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: userRating > 0 ? '#10b981' : '#d1d5db',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: userRating > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
