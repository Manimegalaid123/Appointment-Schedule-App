import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import { businessAPI, appointmentAPI } from '../utils/api';
import './CustomerDashboard.css';

const CustomerDashboard = ({ customerName }) => {
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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Fetch services when businessEmail changes and is a valid email
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
      console.log('Submitting appointment:', {
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await appointmentAPI.create({
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <div className="booking-container">
        <div className="success-message">
          <div className="success-icon"><CheckCircle size={64} /></div>
          <h2>Appointment Booked Successfully!</h2>
          <p>Confirmation sent to <strong>{formData.businessEmail}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} required placeholder="Enter full name" />
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} required placeholder="+1 (555) 123-4567" />
        </div>
        <div className="form-group">
          <label>Business/Shop Email *</label>
          <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} required placeholder="shop@example.com" />
        </div>
        <div className="form-group">
          <label>Service *</label>
          <select name="service" value={formData.service} onChange={handleInputChange} required disabled={services.length === 0}>
            <option value="">Choose a service</option>
            {services.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
          {serviceError && <p className="field-error">{serviceError}</p>}
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} min={getTodayDate()} max={getMaxDate()} required />
        </div>
        <div className="form-group">
          <label>Time *</label>
          <select name="time" value={formData.time} onChange={handleInputChange} required>
            <option value="">Choose a time</option>
            {timeSlots.map((slot, i) => <option key={i} value={slot.value}>{slot.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="4" placeholder="Special requests..."></textarea>
        </div>
        <button type="submit" disabled={!isFormValid() || isSubmitting} className="submit-button">
          {isSubmitting ? 'Booking...' : <><Send size={16} /> Book Appointment</>}
        </button>
      </form>
      <div className="available-services">
        <h3>Available Services:</h3>
        {services.length > 0 ? (
          services.map(service => (
            <div key={service}>{service}</div>
          ))
        ) : (
          <p>No services available. Please enter your business email to see services.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;