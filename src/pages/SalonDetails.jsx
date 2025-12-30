import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Calendar,
  Users,
  CheckCircle,
  Heart,
  Share2,
  Navigation,
  Camera,
  Award,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import BookingForm from './BookingForm';
import './SalonDetails.css'; // Add this CSS file

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/businesses/${id}`);
        if (res.data.success) {
          setSalon(res.data.business);
          // Fetch reviews
          const reviewsRes = await axios.get(`http://localhost:5000/api/appointments/ratings/${res.data.business.email}`);
          if (reviewsRes.data.success) {
            setReviews(reviewsRes.data.allReviews || []);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching salon:', err);
        setLoading(false);
      }
    };
    fetchSalon();
  }, [id]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowBookingForm(true);
  };

  const openInMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/${encodedAddress}`;
    window.open(url, '_blank');
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    const r = Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={size}
          className={`salon-star ${i <= r ? 'salon-star-filled' : 'salon-star-empty'}`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="salon-details-loading-container">
        <div className="salon-loading-content">
          <div className="salon-loading-spinner" />
          <span className="salon-loading-text">Loading salon details...</span>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="salon-details-not-found">
        <div className="salon-not-found-content">
          <h2 className="salon-not-found-title">Salon not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="salon-go-back-btn"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const totalReviews = reviews.length;

  return (
    <div className="salon-details-main-wrapper">
      {/* Header with Back Button */}
      <div className="salon-details-sticky-header">
        <div className="salon-header-content">
          <button
            onClick={() => navigate(-1)}
            className="salon-back-button"
          >
            <ArrowLeft size={16} />
            Back to Search
          </button>

          <div className="salon-header-actions">
            <button className="salon-heart-btn">
              <Heart size={16} />
            </button>
            <button className="salon-share-btn">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="salon-details-container">
        {/* Hero Section */}
        <div className="salon-hero-section">
          {/* Main Image */}
          <div 
            className="salon-hero-image"
            style={{
              backgroundImage: salon.imageUrl 
                ? `url(http://localhost:5000${salon.imageUrl})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <div className="salon-hero-overlay" />
            
            {/* Overlay Content */}
            <div className="salon-hero-content">
              <div className="salon-hero-info-wrapper">
                <div className="salon-hero-text">
                  <div className="salon-business-type-badge">
                    {salon.businessType && salon.businessType.charAt(0).toUpperCase() + salon.businessType.slice(1)}
                  </div>
                  
                  <h1 className="salon-hero-title">
                    {salon.businessName}
                  </h1>
                  
                  {averageRating > 0 && (
                    <div className="salon-hero-rating">
                      <div className="salon-hero-stars">
                        {renderStars(averageRating, 20)}
                      </div>
                      <span className="salon-rating-text">
                        {averageRating} ({totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="salon-book-appointment-btn"
                >
                  <Calendar size={20} />
                  Book Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="salon-info-cards-grid">
            {/* Address Card */}
            <div className="salon-info-card">
              <div className="salon-info-icon salon-location-icon">
                <MapPin size={24} />
              </div>
              <div className="salon-info-content">
                <h3 className="salon-info-title">Location</h3>
                <p className="salon-info-text">{salon.businessAddress}</p>
                <button
                  onClick={() => openInMaps(salon.businessAddress)}
                  className="salon-directions-btn"
                >
                  <Navigation size={14} />
                  Get Directions
                </button>
              </div>
            </div>

            {/* Contact Card */}
            <div className="salon-info-card">
              <div className="salon-info-icon salon-phone-icon">
                <Phone size={24} />
              </div>
              <div className="salon-info-content">
                <h3 className="salon-info-title">Contact</h3>
                <p className="salon-info-text">{salon.phone}</p>
                <p className="salon-info-email">{salon.email}</p>
              </div>
            </div>

            {/* Hours Card */}
            <div className="salon-info-card">
              <div className="salon-info-icon salon-clock-icon">
                <Clock size={24} />
              </div>
              <div className="salon-info-content">
                <h3 className="salon-info-title">Working Hours</h3>
                <p className="salon-info-text">{salon.workingHours || '9:00 AM - 7:00 PM'}</p>
                <span className="salon-open-status">Open Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="salon-services-section">
          <h2 className="salon-section-title">Our Services</h2>
          
          <div className="salon-services-grid">
            {salon.services && salon.services.map((service, idx) => (
              <div
                key={idx}
                onClick={() => handleServiceSelect(service)}
                className={`salon-service-card ${selectedService === service ? 'salon-service-selected' : ''}`}
              >
                {/* Service Image */}
                <div className="salon-service-image">
                  {service.imageUrl ? (
                    <img 
                      src={service.imageUrl} 
                      alt={service.name || service}
                      className="salon-service-img"
                    />
                  ) : (
                    <div className="salon-service-placeholder">
                      <Camera size={48} />
                    </div>
                  )}
                </div>

                {/* Service Info */}
                <div className="salon-service-info">
                  <h3 className="salon-service-name">
                    {service.name || service}
                  </h3>
                  
                  {service.description && (
                    <p className="salon-service-description">
                      {service.description}
                    </p>
                  )}

                  {/* Service Rating */}
                  {service.rating && (
                    <div className="salon-service-rating">
                      <div className="salon-service-stars">
                        {renderStars(service.rating, 16)}
                      </div>
                      <span className="salon-service-rating-text">
                        {service.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServiceSelect(service);
                    }}
                    className={`salon-service-book-btn ${selectedService === service ? 'salon-book-selected' : ''}`}
                  >
                    <Calendar size={16} />
                    {selectedService === service ? 'Selected' : 'Book This Service'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="salon-reviews-section">
            <div className="salon-reviews-header">
              <h2 className="salon-section-title">Customer Reviews</h2>
              
              <div className="salon-reviews-summary">
                <div className="salon-rating-badge">
                  <Star size={20} className="salon-rating-star" />
                  <span className="salon-rating-number">{averageRating}</span>
                </div>
                <span className="salon-reviews-count">
                  Based on {totalReviews} reviews
                </span>
              </div>
            </div>

            <div className="salon-reviews-list">
              {reviews.slice(0, 6).map((review, idx) => (
                <div key={idx} className="salon-review-card">
                  <div className="salon-review-content">
                    {/* Customer Avatar */}
                    <div className="salon-customer-avatar">
                      {(review.customerName || 'C').charAt(0).toUpperCase()}
                    </div>

                    <div className="salon-review-details">
                      {/* Review Header */}
                      <div className="salon-review-header">
                        <div className="salon-customer-info">
                          <h4 className="salon-customer-name">
                            {review.customerName || 'Customer'}
                          </h4>
                          <div className="salon-review-meta">
                            <div className="salon-review-stars">
                              {renderStars(review.rating, 14)}
                            </div>
                            <span className="salon-review-date">
                              {review.daysAgo !== undefined ? 
                                `${review.daysAgo === 0 ? 'Today' : `${review.daysAgo} days ago`}` :
                                new Date(review.ratedAt).toLocaleDateString()
                              }
                            </span>
                          </div>
                        </div>

                        <div className="salon-service-tag">
                          {review.service}
                        </div>
                      </div>

                      {/* Review Content */}
                      {review.notes && (
                        <p className="salon-review-text">
                          "{review.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 6 && (
              <div className="salon-view-all-reviews">
                <button className="salon-view-all-btn">
                  View All Reviews ({reviews.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="salon-booking-modal-overlay">
          <div className="salon-booking-modal">
            <div className="salon-booking-header">
              <h3 className="salon-booking-title">Book Appointment</h3>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedService(null);
                }}
                className="salon-booking-close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="salon-booking-content">
              <BookingForm
                business={salon}
                service={selectedService?.name || selectedService}
                workingHours={salon.workingHours}
                onClose={() => {
                  setShowBookingForm(false);
                  setSelectedService(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonDetails;
