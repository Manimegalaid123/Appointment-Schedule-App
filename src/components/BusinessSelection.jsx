import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessSelection = () => {
  const [selectedType, setSelectedType] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Fetch businesses when type is selected
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!selectedType) {
        setBusinesses([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/businesses?type=${selectedType}`);
        if (response.data.success) {
          setBusinesses(response.data.businesses);
        } else {
          setBusinesses([]);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [selectedType]);

  // Handle business selection
  const handleBusinessSelect = (business) => {
    // Navigate to salon detail page or booking page
    navigate(`/salon/${business._id}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            Choose Your Appointment Type
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Select the type of service you're looking for and browse available providers
          </p>
        </div>

        {/* Business Type Selection */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px'
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
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '16px 20px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <option value="">-- Select Type --</option>
            <option value="salon">Salon</option>
            <option value="clinic">Clinic</option>
            <option value="consultant">Consultant</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280' }}>Loading {selectedType}s...</p>
          </div>
        )}

        {/* No Selection State */}
        {!selectedType && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <Building2 size={64} style={{ marginBottom: '16px', opacity: 0.5, margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Select a Service Type</h3>
            <p style={{ margin: 0 }}>Choose from Salon, Clinic, or Consultant to see available providers</p>
          </div>
        )}

        {/* No Businesses Found */}
        {selectedType && !loading && businesses.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <Building2 size={64} style={{ marginBottom: '16px', opacity: 0.3, margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#374151' }}>
              No {selectedType === 'salon' ? 'Salons' : 
                  selectedType === 'clinic' ? 'Clinics' : 
                  selectedType === 'consultant' ? 'Consultants' : 'Businesses'} Found
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              No registered {selectedType}s available at the moment. Please try again later.
            </p>
          </div>
        )}

        {/* Businesses Grid */}
        {selectedType && !loading && businesses.length > 0 && (
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Available {selectedType === 'salon' ? 'Salons' : 
                        selectedType === 'clinic' ? 'Clinics' : 
                        selectedType === 'consultant' ? 'Consultants' : 'Services'} ({businesses.length})
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {businesses.map(business => (
                <div 
                  key={business._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleBusinessSelect(business)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Business Image */}
                  <div style={{
                    width: '100%',
                    height: '200px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f9fafb'
                  }}>
                    {business.imageUrl ? (
                      <img
                        src={`http://localhost:5000${business.imageUrl}`}
                        alt={business.businessName}
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
                      display: business.imageUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3f4f6',
                      color: '#9ca3af'
                    }}>
                      <Building2 size={48} />
                    </div>

                    {/* Type Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: selectedType === 'salon' ? '#10b981' : 
                                      selectedType === 'clinic' ? '#3b82f6' : '#8b5cf6',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {selectedType}
                    </div>
                  </div>

                  {/* Business Info */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{
                      margin: '0 0 12px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {business.businessName}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <MapPin size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
                      <span>{business.businessAddress}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <Phone size={14} style={{ marginRight: '8px' }} />
                      <span>{business.phone || 'Phone not available'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <Clock size={14} style={{ marginRight: '8px' }} />
                      <span>{business.workingHours || '9:00 AM - 7:00 PM'}</span>
                    </div>

                    {/* Services Preview */}
                    {business.services && business.services.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{
                          margin: '0 0 8px 0',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#4b5563',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Services Available
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {business.services.slice(0, 3).map((service, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              {service}
                            </span>
                          ))}
                          {business.services.length > 3 && (
                            <span style={{
                              color: '#6b7280',
                              fontSize: '11px',
                              padding: '4px 8px'
                            }}>
                              +{business.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: selectedType === 'salon' ? '#10b981' : 
                                        selectedType === 'clinic' ? '#3b82f6' : '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.opacity = '0.9';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.opacity = '1';
                      }}
                    >
                      View Details & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSS for spinner animation */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default BusinessSelection;