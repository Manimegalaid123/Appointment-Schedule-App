import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; // Make sure this is imported
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
  FileText,
  Star  // ADD THIS IMPORT FOR STAR ICON
} from 'lucide-react';
import { appointmentAPI, businessAPI } from '../utils/api';
import './SalonDashboard.css';

// REPLACE your RatingStatistics component with this enhanced version:
const RatingStatistics = ({ businessEmail }) => {
  const [ratingData, setRatingData] = useState({
    statistics: {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: [0, 0, 0, 0, 0]
    },
    recentReviews: [],
    allReviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('recent');

  // Real-time rating fetch function
  const fetchRatings = async () => {
    if (!businessEmail) return;
    
    try {
      console.log('🔄 Fetching real-time ratings for:', businessEmail);
      
      const response = await axios.get(`http://localhost:5000/api/appointments/ratings/${businessEmail}`);
      
      // ADD THIS DEBUG CODE:
      console.log('📊 RAW API Response:', response.data);
      console.log('📊 Statistics received:', response.data.statistics);
      console.log('📊 Average rating type:', typeof response.data.statistics?.averageRating);
      console.log('📊 Average rating value:', response.data.statistics?.averageRating);
      
      if (response.data.success) {
        setRatingData(response.data);
        console.log('📊 Real-time rating data updated:', response.data.statistics);
        console.log('📋 All reviews loaded:', response.data.allReviews?.length || 0);
      } else {
        setError('Failed to load rating data');
      }
    } catch (error) {
      console.error('❌ Error fetching ratings:', error);
      setError('Failed to load ratings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchRatings, 30000);
    
    return () => clearInterval(interval);
  }, [businessEmail]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <RefreshCw size={32} className="salon-loading-spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading ratings & reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
        <button 
          onClick={fetchRatings}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  const { statistics, recentReviews, allReviews } = ratingData;
  const displayReviews = viewMode === 'recent' ? recentReviews : allReviews;

  // FIX: Proper calculation functions
  const getAverageRating = () => {
    if (!statistics || statistics.totalRatings === 0) return 0;
    console.log('Frontend: Raw averageRating from backend:', statistics.averageRating);
    return parseFloat(statistics.averageRating).toFixed(1);
  };

  const getPositivePercentage = () => {
    if (!statistics || statistics.totalRatings === 0) return 0;
    const positiveReviews = (statistics.ratingBreakdown[4] || 0) + (statistics.ratingBreakdown[3] || 0);
    return Math.round((positiveReviews / statistics.totalRatings) * 100);
  };

  const getRatingPercentage = (ratingIndex) => {
    if (!statistics || statistics.totalRatings === 0) return 0;
    const count = statistics.ratingBreakdown[ratingIndex] || 0;
    return Math.round((count / statistics.totalRatings) * 100);
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header with Refresh Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={24} fill="#ffd700" color="#ffd700" />
          Customer Ratings & Reviews
        </h3>
        <button
          onClick={fetchRatings}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      
      {statistics.totalRatings === 0 ? (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', 
          padding: '3rem', 
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px dashed #cbd5e0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌟</div>
          <h4 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>No Customer Reviews Yet</h4>
          <p style={{ color: '#718096', fontSize: '1rem' }}>
            Complete some appointments to start receiving reviews from your customers!
          </p>
        </div>
      ) : (
        <>
          {/* FIX: Statistics Cards with proper calculations */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Average Rating Card - FIXED */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '2rem', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', position: 'relative' }}>
                {getAverageRating()}
              </div>
              <div style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={22}
                    fill={star <= Math.round(parseFloat(getAverageRating())) ? '#ffd700' : 'transparent'}
                    color={star <= Math.round(parseFloat(getAverageRating())) ? '#ffd700' : 'rgba(255,255,255,0.3)'}
                    style={{ marginRight: '3px' }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.9, position: 'relative' }}>Average Rating</div>
            </div>
            
            {/* Total Reviews Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              padding: '2rem', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-30px',
                left: '-30px',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', position: 'relative' }}>
                {statistics.totalRatings || 0}
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.9, position: 'relative' }}>Total Reviews</div>
            </div>
            
            {/* Positive Reviews Card - FIXED */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              color: 'white',
              padding: '2rem', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(240, 147, 251, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                bottom: '-40px',
                right: '-40px',
                width: '90px',
                height: '90px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', position: 'relative' }}>
                {getPositivePercentage()}%
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.9, position: 'relative' }}>Positive Reviews</div>
            </div>
          </div>

          {/* FIX: Rating Breakdown with proper calculations */}
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: '2rem',
            border: '1px solid #f1f5f9'
          }}>
            <h4 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.25rem' }}>Rating Breakdown</h4>
            {[5, 4, 3, 2, 1].map(rating => {
              const ratingIndex = rating - 1;
              const count = statistics.ratingBreakdown[ratingIndex] || 0;
              const percentage = getRatingPercentage(ratingIndex);
              
              return (
                <div key={rating} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  gap: '1rem'
                }}>
                  <div style={{ 
                    minWidth: '70px', 
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#374151'
                  }}>
                    <span>{rating}</span>
                    <Star size={16} fill="#ffd700" color="#ffd700" />
                  </div>
                  <div style={{ 
                    flex: 1, 
                    height: '10px', 
                    backgroundColor: '#f1f5f9',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      height: '100%',
                      width: `${percentage}%`,
                      background: rating >= 4 ? 'linear-gradient(90deg, #10b981, #059669)' : rating >= 3 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                      borderRadius: '5px',
                      transition: 'width 0.5s ease',
                      position: 'relative'
                    }}>
                      {count > 0 && (
                        <div style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    minWidth: '40px', 
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textAlign: 'right'
                  }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reviews Section */}
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            {/* View Toggle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>
                💬 Customer Reviews ({displayReviews.length})
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setViewMode('recent')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: viewMode === 'recent' ? '#667eea' : '#f8fafc',
                    color: viewMode === 'recent' ? 'white' : '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Recent ({recentReviews.length})
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: viewMode === 'all' ? '#667eea' : '#f8fafc',
                    color: viewMode === 'all' ? 'white' : '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  All Reviews ({allReviews.length})
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div style={{ 
              display: 'grid',
              gap: '1rem',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {displayReviews.map((review, index) => (
                <div key={index} style={{ 
                  background: 'linear-gradient(135deg, #fafbfc, #f8fafc)', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Customer Avatar */}
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}>
                        {review.customerInitial}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>
                          {review.customerName}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                          {review.daysAgo !== undefined ? 
                            `${review.daysAgo === 0 ? 'Today' : `${review.daysAgo} days ago`}` :
                            new Date(review.ratedAt).toLocaleDateString()
                          }
                        </div>
                      </div>
                    </div>
                    {/* Rating Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={18}
                            fill={star <= review.rating ? '#ffd700' : 'transparent'}
                            color={star <= review.rating ? '#ffd700' : '#e2e8f0'}
                            style={{ marginRight: '1px' }}
                          />
                        ))}
                      </div>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: '#1e293b',
                        fontSize: '0.9rem',
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        {review.rating}/5
                      </span>
                    </div>
                  </div>
                  
                  {/* Service Info */}
                  <div style={{ 
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ 
                      color: '#667eea', 
                      fontSize: '0.95rem', 
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      💄 Service: {review.service}
                    </div>
                    <div style={{ 
                      color: '#64748b', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>📅 {new Date(review.appointmentDate).toLocaleDateString()}</span>
                      <span>⏰ {review.appointmentTime}</span>
                      {review.customerPhone !== 'N/A' && (
                        <span>📞 {review.customerPhone}</span>
                      )}
                    </div>
                  </div>

                  {/* Notes if available */}
                  {review.notes && (
                    <div style={{
                      background: '#fefce8',
                      border: '1px solid #fef3c7',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: '#92400e',
                      fontStyle: 'italic'
                    }}>
                      "Customer Notes: {review.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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
  const [breaks, setBreaks] = useState([]);
  
  // Add these missing state variables for Edit Profile
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    businessName: '',
    businessAddress: '',
    workingHours: '',
    phone: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Break management state
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakFormData, setBreakFormData] = useState({
    day: 'Monday',
    startTime: '13:00',
    endTime: '14:00',
    breakType: 'Lunch',
    description: 'Lunch break',
    applyToAllDays: false
  });

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

  // Delete service
  const handleDeleteService = async (serviceName) => {
    if (!salonInfo || !window.confirm(`Delete "${serviceName}" service?`)) return;
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/business/${salonInfo._id}/service/${encodeURIComponent(serviceName)}`
      );
      if (response.data.success) {
        setSalonInfo(prev => ({
          ...prev,
          services: response.data.business.services
        }));
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    }
  };

  // Add break/lunch time
  const handleAddBreak = async () => {
    if (!salonInfo) return;
    try {
      // If applying to all days, send each day separately
      if (breakFormData.applyToAllDays) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        for (const day of days) {
          const response = await axios.post(
            `http://localhost:5000/api/business/${salonInfo._id}/breaks`,
            {
              day,
              startTime: breakFormData.startTime,
              endTime: breakFormData.endTime,
              breakType: breakFormData.breakType,
              description: breakFormData.description
            }
          );
          
          if (response.data.success) {
            setBreaks(response.data.business.breaks || []);
          }
        }
        
        setShowBreakModal(false);
        setBreakFormData({
          day: 'Monday',
          startTime: '13:00',
          endTime: '14:00',
          breakType: 'Lunch',
          description: 'Lunch break',
          applyToAllDays: false
        });
        alert('Break added for all days successfully!');
      } else {
        const response = await axios.post(
          `http://localhost:5000/api/business/${salonInfo._id}/breaks`,
          breakFormData
        );
        if (response.data.success) {
          setBreaks(response.data.business.breaks || []);
          setShowBreakModal(false);
          setBreakFormData({
            day: 'Monday',
            startTime: '13:00',
            endTime: '14:00',
            breakType: 'Lunch',
            description: 'Lunch break',
            applyToAllDays: false
          });
          alert('Break added successfully!');
        }
      }
    } catch (err) {
      console.error('Error adding break:', err);
      alert('Failed to add break');
    }
  };

  // Delete break
  const handleDeleteBreak = async (breakId) => {
    if (!salonInfo || !window.confirm('Delete this break?')) return;
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/business/${salonInfo._id}/breaks/${breakId}`
      );
      if (response.data.success) {
        setBreaks(response.data.business.breaks || []);
      }
    } catch (err) {
      console.error('Error deleting break:', err);
      alert('Failed to delete break');
    }
  };

  // Fetch breaks
  useEffect(() => {
    if (salonInfo?._id) {
      const fetchBreaks = async () => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/business/${salonInfo._id}/breaks`
          );
          if (response.data.success) {
            setBreaks(response.data.breaks || []);
          }
        } catch (err) {
          console.error('Error fetching breaks:', err);
        }
      };
      fetchBreaks();
    }
  }, [salonInfo?._id]);

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

  // Edit Profile Modal Component
  const EditProfileModal = () => (
    <div className="salon-modal-overlay" style={{
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
      <div className="salon-modal-content" style={{
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
          <div className="salon-form-group" style={{ marginBottom: '20px' }}>
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
          <div className="salon-form-group" style={{ marginBottom: '15px' }}>
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
          <div className="salon-form-group" style={{ marginBottom: '15px' }}>
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
          <div className="salon-form-group" style={{ marginBottom: '15px' }}>
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
          <div className="salon-form-group" style={{ marginBottom: '20px' }}>
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

  // CUSTOMER VIEW: Load appointments for the customer
  const customerEmail = localStorage.getItem('customerEmail');
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        console.log('🔄 Fetching appointments for customer:', customerEmail);
        
        const res = await axios.get(`http://localhost:5000/api/appointments/customer/${customerEmail}`);
        
        console.log('📋 Raw appointments response:', res.data);
        
        if (res.data.success && res.data.appointments) {
          // SIMPLIFIED VERSION - Don't fetch business details, use appointment data
          const appointmentsData = res.data.appointments.map(appointment => ({
            ...appointment,
            // SAFE PROPERTY ACCESS with fallbacks
            businessName: appointment.businessName || appointment.businessEmail || 'Business Name Not Available',
            businessAddress: appointment.businessAddress || 'Address not available',
            businessPhone: appointment.businessPhone || 'Phone not available',
            workingHours: appointment.workingHours || '9:00 AM - 6:00 PM'
          }));
          
          setAppointments(appointmentsData);
          console.log('✅ Appointments loaded:', appointmentsData.length);
        } else {
          console.log('❌ No appointments found');
          setAppointments([]);
        }
      } catch (err) {
        console.error('❌ Error fetching appointments:', err);
        setAppointments([]);
      }
    };

    if (customerEmail) {
      fetchAppointments();
    } else {
      console.log('❌ No customer email found');
    }
  }, [customerEmail]);

  if (loading && !salonInfo) {
    return (
      <div className="salon-loading-container">
        <div className="salon-loading-content">
          <RefreshCw size={48} className="salon-loading-spinner" />
          <h3>Loading Salon Dashboard</h3>
          <p>Please wait while we load your salon information...</p>
        </div>
      </div>
    );
  }

  if (error && !salonInfo) {
    return (
      <div className="salon-error-container">
        <div className="salon-error-content">
          <AlertCircle size={48} className="salon-error-icon" />
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button className="salon-retry-btn" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-dashboard-container">
      {/* Header */}
      <header className="salon-dashboard-header">
        <div className="salon-header-content">
          <div className="salon-header-left">
            <div className="salon-logo-section">
              {/* Show salon image in header if available */}
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
                <Scissors size={24} className="salon-logo-icon" />
              )}
              <div className="salon-info-section">
                <h1 className="salon-name">{salonInfo?.name}</h1>
                <p className="salon-tagline">Professional Salon Management</p>
              </div>
            </div>
          </div>
          <div className="salon-header-right">
            <div className="salon-notification-badge">
              <Bell size={20} />
              {notifications > 0 && <span className="salon-badge-count">{notifications}</span>}
            </div>
            <div className="salon-user-menu">
              <User size={16} />
              <span>Manager</span>
              <ChevronDown size={16} />
            </div>
            <button className="salon-logout-btn">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="salon-dashboard-main">
        {/* Stats */}
        <section className="salon-stats-section">
          <div className="salon-stats-grid">
            <div className="salon-stat-card salon-total">
              <div className="salon-stat-icon">
                <BarChart3 size={24} />
              </div>
              <div className="salon-stat-info">
                <div className="salon-stat-number">{stats.total}</div>
                <div className="salon-stat-label">Total Appointments</div>
              </div>
            </div>
            <div className="salon-stat-card salon-pending">
              <div className="salon-stat-icon">
                <Clock size={24} />
              </div>
              <div className="salon-stat-info">
                <div className="salon-stat-number">{stats.pending}</div>
                <div className="salon-stat-label">Pending Requests</div>
              </div>
            </div>
            <div className="salon-stat-card salon-accepted">
              <div className="salon-stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="salon-stat-info">
                <div className="salon-stat-number">{stats.accepted}</div>
                <div className="salon-stat-label">Confirmed</div>
              </div>
            </div>
            <div className="salon-stat-card salon-rejected">
              <div className="salon-stat-icon">
                <XCircle size={24} />
              </div>
              <div className="salon-stat-info">
                <div className="salon-stat-number">{stats.rejected}</div>
                <div className="salon-stat-label">Declined</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="salon-tabs-section">
          <div className="salon-tabs-container">
            <nav className="salon-tabs-nav">
              <button 
                className={`salon-tab-btn ${activeTab === 'appointments' ? 'salon-active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                <Calendar size={18} /> 
                Appointments 
                <span className="salon-tab-count">{stats.total}</span>
              </button>
              <button 
                className={`salon-tab-btn ${activeTab === 'salon-info' ? 'salon-active' : ''}`}
                onClick={() => setActiveTab('salon-info')}
              >
                <Scissors size={18} /> 
                Salon Information
              </button>
              <button 
                className={`salon-tab-btn ${activeTab === 'settings' ? 'salon-active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={18} /> 
                Settings
              </button>
              {/* ADD this to your existing tab buttons */}
              <button 
                className={`salon-tab-btn ${activeTab === 'ratings' ? 'salon-active' : ''}`}
                onClick={() => setActiveTab('ratings')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: activeTab === 'ratings' ? '#667eea' : 'transparent',
                  color: activeTab === 'ratings' ? 'white' : '#6b7280',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                ⭐ Ratings & Reviews
              </button>
            </nav>

            <div className="salon-tab-content">
              {activeTab === 'appointments' && (
                <div className="salon-appointments-tab">
                  <div className="salon-appointments-header">
                    <div className="salon-search-filters">
                      <div className="salon-search-box">
                        <Search size={20} />
                        <input
                          type="text"
                          
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="salon-search-input"
                        />
                      </div>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="salon-status-filter"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Confirmed</option>
                        <option value="rejected">Declined</option>
                       
                      </select>
                    </div>
                    <div className="salon-header-actions">
                      <button 
                        className="salon-refresh-btn" 
                        onClick={loadAppointments} 
                        disabled={loading}
                      >
                        <RefreshCw size={16} /> Refresh
                      </button>
                      {appointments.length > 0 && (
                        <button className="salon-export-btn" onClick={exportAppointments}>
                          <Download size={16} /> Export
                        </button>
                      )}
                    </div>
                  </div>

                  {loading && appointments.length === 0 ? (
                    <div className="salon-loading-state">
                      <RefreshCw size={32} className="salon-loading-spinner" />
                      <p>Loading appointments...</p>
                    </div>
                  ) : (
                    <div className="salon-appointments-list">
                      <div className="salon-appointments-grid">
                        {filteredAppointments.length === 0 ? (
                          <div className="salon-empty-state">
                            <Calendar size={48} />
                            <h3>No appointments found</h3>
                            <p>Your scheduled appointments will appear here</p>
                          </div>
                        ) : (
                          filteredAppointments.map(appointment => (
                            <div key={appointment._id} className="salon-appointment-card">
                              <div className="salon-appointment-header">
                                <div className="salon-appointment-service">
                                  <Building2 size={18} />
                                  <span>{appointment.service}</span>
                                </div>
                                <span 
                                  className="salon-appointment-status"
                                  style={{
                                    backgroundColor: `${getStatusColor(appointment.status)}15`,
                                    color: getStatusColor(appointment.status),
                                    border: `1px solid ${getStatusColor(appointment.status)}30`
                                  }}
                                >
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              <div className="salon-appointment-details">
                                <div className="salon-detail-item">
                                  <User size={16} />
                                  <span>{appointment.customerName || appointment.customerEmail || 'Customer'}</span>
                                </div>
                                <div className="salon-detail-item">
                                  <Calendar size={16} />
                                  <span>{new Date(appointment.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</span>
                                </div>
                                <div className="salon-detail-item">
                                  <Clock size={16} />
                                  <span>{appointment.time}</span>
                                </div>
                                {appointment.notes && (
                                  <div className="salon-detail-item">
                                    <FileText size={16} />
                                    <span>{appointment.notes}</span>
                                  </div>
                                )}
                              </div>
                              {appointment.status === 'pending' && (
                                <div className="salon-appointment-actions">
                                  <button
                                    className="salon-action-btn salon-accept"
                                    onClick={() => handleAppointmentAction(appointment._id, 'accept')}
                                  >
                                    <Check size={16} /> Accept
                                  </button>
                                  <button
                                    className="salon-action-btn salon-reject"
                                    onClick={() => handleAppointmentAction(appointment._id, 'reject')}
                                  >
                                    <X size={16} /> Reject
                                  </button>
                                 
                                </div>
                              )}
                              {appointment.status === 'accepted' && (
                                <button
                                  onClick={() => handleCompleteService(appointment._id)}
                                  className="salon-complete-btn"
                                >
                                  ✅ Mark Service Complete
                                </button>
                              )}
                              {appointment.status === 'completed' && (
                                <div className="salon-completed-badge">
                                  <div className="salon-completed-title">
                                    🎉 SERVICE COMPLETED
                                  </div>
                                  <div className="salon-completed-subtitle">
                                    Customer can now rate this service
                                  </div>
                                  {appointment.completedAt && (
                                    <div className="salon-completed-date">
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
                  <div className="salon-info-section">
                    <h3 className="salon-section-title">Business Details</h3>
                    <div className="salon-info-grid">
                      <div className="salon-info-item">
                        <strong>Salon Name:</strong> {salonInfo.name}
                      </div>
                      <div className="salon-info-item">
                        <strong>Business Email:</strong> {salonInfo.email}
                      </div>
                      <div className="salon-info-item">
                        <strong>Phone:</strong> {salonInfo.phone}
                      </div>
                      <div className="salon-info-item">
                        <strong>Address:</strong> {salonInfo.address}
                      </div>
                      <div className="salon-info-item">
                        <strong>Working Hours:</strong> {salonInfo.workingHours}
                      </div>
                    </div>
                  </div>

                  <div className="salon-services-section">
                    <h3 className="salon-section-title">Services Offered</h3>
                    <div className="salon-services-grid">
                      {salonInfo.services.map((service, i) => (
                        <div key={i} className="salon-service-item">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Scissors size={16} /> {service}
                            </div>
                            <button
                              onClick={() => handleDeleteService(service)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                              title="Delete service"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="salon-add-service-btn"
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

                  <div className="salon-booking-section">
                    <h3 className="salon-section-title">Online Booking</h3>
                    <p>Customers can book appointments using:</p>
                    <div className="salon-booking-info">
                      <code className="salon-booking-email">{salonInfo.email}</code>
                      <button 
                        className="salon-copy-btn"
                        onClick={() => navigator.clipboard.writeText(salonInfo.email)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="salon-breaks-section" style={{ marginTop: '2rem' }}>
                    <h3 className="salon-section-title">Break Times & Leaves</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                      Set lunch breaks, leaves, or other unavailable times. Customers won't be able to book during these times.
                    </p>
                    
                    <div className="salon-breaks-list" style={{ marginBottom: '1rem' }}>
                      {breaks.length === 0 ? (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>No breaks set yet</p>
                      ) : (
                        breaks.map((breakItem, idx) => (
                          <div key={idx} style={{
                            background: '#f5f5f5',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                            border: '1px solid #ddd'
                          }}>
                            <div>
                              <strong>{breakItem.day}</strong> - {breakItem.startTime} to {breakItem.endTime}
                              <br />
                              <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                {breakItem.breakType}: {breakItem.description}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteBreak(breakItem._id)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              <X size={14} style={{ marginRight: '4px' }} /> Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => setShowBreakModal(true)}
                      style={{
                        background: '#50C9CE',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Plus size={16} /> Add Break Time
                    </button>
                  </div>

                  {/* Break Modal */}
                  {showBreakModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '500px'
                      }}>
                        <h3 style={{ marginTop: 0 }}>Add Break Time</h3>
                        
                        <div style={{ marginBottom: '1rem', padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={breakFormData.applyToAllDays}
                              onChange={(e) => setBreakFormData({ ...breakFormData, applyToAllDays: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '500', color: '#1e40af' }}>Apply to All Days (Mon - Sun)</span>
                          </label>
                        </div>
                        
                        {!breakFormData.applyToAllDays && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Day:</label>
                            <select
                              value={breakFormData.day}
                              onChange={(e) => setBreakFormData({ ...breakFormData, day: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '6px'
                              }}
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Time:</label>
                            <input
                              type="time"
                              value={breakFormData.startTime}
                              onChange={(e) => setBreakFormData({ ...breakFormData, startTime: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Time:</label>
                            <input
                              type="time"
                              value={breakFormData.endTime}
                              onChange={(e) => setBreakFormData({ ...breakFormData, endTime: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Break Type:</label>
                          <select
                            value={breakFormData.breakType}
                            onChange={(e) => setBreakFormData({ ...breakFormData, breakType: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '6px'
                            }}
                          >
                            <option value="Lunch">Lunch Break</option>
                            <option value="Leave">Leave</option>
                            <option value="Break">Short Break</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description:</label>
                          <input
                            type="text"
                            value={breakFormData.description}
                            onChange={(e) => setBreakFormData({ ...breakFormData, description: e.target.value })}
                            placeholder="e.g., Lunch break, Doctor appointment"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setShowBreakModal(false)}
                            style={{
                              padding: '10px 16px',
                              border: '1px solid #ddd',
                              background: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddBreak}
                            style={{
                              padding: '10px 16px',
                              background: '#50C9CE',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Add Break
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="salon-settings-tab">
                  <div className="salon-settings-section">
                    <h3 className="salon-section-title">Notification Preferences</h3>
                    <div className="salon-settings-group">
                      <label className="salon-setting-item">
                        <input type="checkbox" defaultChecked /> 
                        <span>Email Notifications</span>
                      </label>
                      <label className="salon-setting-item">
                        <input type="checkbox" defaultChecked /> 
                        <span>Auto-refresh Dashboard</span>
                      </label>
                      <label className="salon-setting-item">
                        <input type="checkbox" /> 
                        <span>Sound Notifications</span>
                      </label>
                    </div>
                  </div>

                  <div className="salon-settings-section">
                    <h3 className="salon-section-title">Data Management</h3>
                    <div className="salon-settings-actions">
                      <button className="salon-setting-btn" onClick={openEditModal}>
                        <Edit2 size={16} /> Edit Profile
                      </button>
                      <button className="salon-setting-btn" onClick={loadAppointments}>
                        <RefreshCw size={16} /> Refresh Data
                      </button>
                      <button 
                        className="salon-setting-btn" 
                        onClick={exportAppointments} 
                        disabled={appointments.length === 0}
                      >
                        <Download size={16} /> Export All Data
                      </button>
                    </div>
                  </div>

                  <div className="salon-settings-section">
                    <h3 className="salon-section-title">Support</h3>
                    <p>Need assistance with your salon dashboard?</p>
                    <button className="salon-support-btn">
                      <Mail size={16} /> Contact Support
                    </button>
                  </div>
                </div>
              )}
              {/* ADD this to your existing tab content */}
              {activeTab === 'ratings' && (
                <div>
                  <RatingStatistics businessEmail={salonInfo?.email} />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && <EditProfileModal />}
    </div>
  );
};

export default SalonDashboard;