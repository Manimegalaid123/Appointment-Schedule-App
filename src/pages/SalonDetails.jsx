import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingForm from './BookingForm';

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/businesses/${id}`);
        if (res.data.success) setSalon(res.data.business);
      } catch (err) {
        setSalon(null);
      }
    };
    fetchSalon();
  }, [id]);

  const renderStars = (rating) => {
    const stars = [];
    const r = Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= r ? '#fbbf24' : '#d1d5db', fontSize: 18 }}>★</span>
      );
    }
    return stars;
  };

  if (!salon) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 16,
          background: '#f3f4f6',
          border: 'none',
          borderRadius: 6,
          padding: '6px 16px',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        marginBottom: 32
      }}>
        {/* Salon Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 8 }}>{salon.businessName}</h1>
          <div style={{ color: '#6b7280', marginBottom: 8 }}>{salon.businessType && salon.businessType.charAt(0).toUpperCase() + salon.businessType.slice(1)}</div>
          <div style={{ marginBottom: 8 }}>
            <b>Address:</b> {salon.businessAddress}
          </div>
          <div style={{ marginBottom: 8 }}>
            <b>Phone:</b> {salon.phone}
          </div>
          <div style={{ marginBottom: 8 }}>
            <b>Email:</b> {salon.email}
          </div>
          <div style={{ marginBottom: 8 }}>
            <b>Working Hours:</b> {salon.workingHours}
          </div>
          {/* Optional: Show overall rating if available */}
          {salon.rating && (
            <div style={{ marginBottom: 8 }}>
              <b>Overall Rating:</b> {salon.rating ? `${salon.rating} / 5` : 'N/A'}
            </div>
          )}
        </div>
        {/* Optional: Shop image if you have one */}
        {salon.imageUrl && (
          <img
            src={salon.imageUrl}
            alt={salon.businessName}
            style={{
              width: 180,
              height: 180,
              objectFit: 'cover',
              borderRadius: 12,
              border: '1px solid #eee'
            }}
          />
        )}
      </div>
      <hr style={{ margin: '32px 0' }} />
      <h3>Services</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {salon.services.map((service, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 16,
              width: 180,
              cursor: 'pointer',
              background: selectedService === service ? '#f0f9ff' : '#fff'
            }}
            onClick={() => setSelectedService(service)}
          >
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{service.name || service}</div>
            {service.imageUrl && (
              <img src={service.imageUrl} alt={service.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, margin: '8px 0' }} />
            )}
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{service.description}</div>
            <div>
              Rating: {service.rating ? `${service.rating.toFixed(1)} / 5` : 'N/A'}
              {/* Optionally, show stars */}
              {service.rating && (
                <span style={{ color: '#fbbf24', marginLeft: 4 }}>
                  {'★'.repeat(Math.round(service.rating))}
                  {'☆'.repeat(5 - Math.round(service.rating))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {selectedService && (
        <div style={{ marginTop: 32, border: '2px solid #6366f1', borderRadius: 12, padding: 24, maxWidth: 400 }}>
          {selectedService.imageUrl && (
            <img
              src={selectedService.imageUrl}
              alt={selectedService.name}
              style={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
                borderRadius: 12,
                marginBottom: 16
              }}
            />
          )}
          <h2>{selectedService.name || selectedService}</h2>
          <div style={{ marginBottom: 8 }}>{selectedService.description}</div>
          <div style={{ marginBottom: 16 }}>
            Rating: {renderStars(selectedService.rating)} {selectedService.rating || 'N/A'}
          </div>
          <BookingForm
            business={salon}
            service={selectedService.name || selectedService}
            workingHours={salon.workingHours}
            onClose={() => setSelectedService(null)}
          />
        </div>
      )}
      {/* Optional: Ratings & Reviews section */}
      {/* <div style={{ marginTop: 48 }}>
        <h3>Customer Reviews</h3>
        <div>No reviews yet.</div>
      </div> */}
    </div>
  );
};

export default SalonDetails;
