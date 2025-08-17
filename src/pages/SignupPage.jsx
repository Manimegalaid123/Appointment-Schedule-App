import React, { useState } from 'react';
import { User, Building, Mail, Phone, MapPin, Lock, Calendar, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';

const BASE_URL = 'http://localhost:5000/api';

const SignupPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [businessName, setBusinessName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const businessTypes = [
    { value: 'salon', label: 'Salon' },
    { value: 'consultancy', label: 'Consultancy' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'education', label: 'Education' }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!role) newErrors.role = 'Please select your role';
    }
    if (step === 2) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    if (step === 3 && role === 'manager') {
      if (!businessType) newErrors.businessType = 'Please select business type';
      if (!businessName) newErrors.businessName = 'Business name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setIsLoading(true);
    try {
      const { confirmPassword, ...userFormData } = formData;
      const payload = {
        ...userFormData,
        role,
      };
      if (role === 'manager') {
        payload.businessType = businessType;
        payload.businessName = businessName;
      }
      await axios.post(`${BASE_URL}/auth/signup`, payload);
      alert('Account created successfully!');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Signup failed. Please try again.';
      setErrors({ submit: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = role === 'manager' ? 3 : 2;

  return (
    <div className="signup-container">
      {/* Navigation */}
      <nav className="signup-navbar">
        <div className="nav-wrapper">
          <div className="nav-content">
            <div className="brand-section">
              <div className="brand-logo">
                <Calendar className="brand-icon" />
              </div>
              <span className="brand-text">AppointmentHub</span>
            </div>
            <div className="nav-actions">
              <span className="nav-text">Already have an account?</span>
              <button 
                className="nav-login-btn"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="signup-content">
        <div className="signup-wrapper">
          {/* Progress Indicator */}
          <div className="progress-section">
            <div className="progress-indicator">
              {[...Array(totalSteps)].map((_, index) => (
                <React.Fragment key={index}>
                  <div className={`progress-step ${
                    currentStep > index + 1 ? 'completed' : 
                    currentStep === index + 1 ? 'active' : 'inactive'
                  }`}>
                    {currentStep > index + 1 ? <Check className="step-icon" /> : index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div className={`progress-line ${currentStep > index + 1 ? 'completed' : ''}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="progress-header">
              <h2 className="step-title">
                {currentStep === 1 && 'Choose Your Role'}
                {currentStep === 2 && 'Personal Information'}
                {currentStep === 3 && 'Business Details'}
              </h2>
              <p className="step-description">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          <form className="signup-form-container" onSubmit={handleSubmit}>
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">What brings you here?</h3>
                  <p className="section-subtitle">Choose the option that best describes you</p>
                </div>
                <div className="role-grid">
                  <div
                    onClick={() => setRole('customer')}
                    className={`role-card ${role === 'customer' ? 'selected customer' : ''}`}
                  >
                    <div className="role-content">
                      <div className={`role-icon ${role === 'customer' ? 'active' : ''}`}>
                        <User className="icon" />
                      </div>
                      <h4 className="role-title">I'm a Customer</h4>
                      <p className="role-description">
                        I want to book appointments with businesses
                      </p>
                      <ul className="role-features">
                        <li>• Browse local businesses</li>
                        <li>• Book appointments easily</li>
                        <li>• Get instant confirmations</li>
                      </ul>
                    </div>
                  </div>
                  <div
                    onClick={() => setRole('manager')}
                    className={`role-card ${role === 'manager' ? 'selected manager' : ''}`}
                  >
                    <div className="role-content">
                      <div className={`role-icon ${role === 'manager' ? 'active' : ''}`}>
                        <Building className="icon" />
                      </div>
                      <h4 className="role-title">I'm a Business Owner</h4>
                      <p className="role-description">
                        I want to manage my business appointments
                      </p>
                      <ul className="role-features">
                        <li>• Manage appointment requests</li>
                        <li>• Set your availability</li>
                        <li>• Grow your customer base</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {errors.role && (
                  <p className="error-message centered">{errors.role}</p>
                )}
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Tell us about yourself</h3>
                  <p className="section-subtitle">We need some basic information to get started</p>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="field-label">
                      <User className="label-icon" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                    />
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <Mail className="label-icon" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <Phone className="label-icon" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                    />
                    {errors.phone && <p className="error-message">{errors.phone}</p>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <MapPin className="label-icon" />
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className={`form-input ${errors.address ? 'error' : ''}`}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <Lock className="label-icon" />
                      Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                    />
                    {errors.password && <p className="error-message">{errors.password}</p>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <Lock className="label-icon" />
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Details */}
            {currentStep === 3 && role === 'manager' && (
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Business Information</h3>
                  <p className="section-subtitle">Help customers find and book with your business</p>
                </div>
                <div className="business-type-section">
                  <label className="field-label">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    className={`form-input ${errors.businessType ? 'error' : ''}`}
                  >
                    <option value="">Select Type</option>
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className="error-message">{errors.businessType}</p>}
                </div>
                <div className="form-field">
                  <label className="field-label">Business Name *</label>
                  <input
                    type="text"
                    placeholder="Business Name"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className={`form-input ${errors.businessName ? 'error' : ''}`}
                  />
                  {errors.businessName && <p className="error-message">{errors.businessName}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              <button
                type="button"
                onClick={handleBack}
                className={`nav-button back-button ${currentStep === 1 ? 'disabled' : ''}`}
                disabled={currentStep === 1}
              >
                Back
              </button>
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="nav-button continue-button"
                >
                  Continue
                  <ArrowRight className="button-icon" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="nav-button submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : <>Create Account <Check className="button-icon" /></>}
                </button>
              )}
            </div>
            {errors.submit && <p className="error-message centered">{errors.submit}</p>}
          </form>

          {/* Login Link */}
          <div className="login-prompt">
            <p className="prompt-text">
              Already have an account?{' '}
              <button 
                className="prompt-link"
                onClick={() => navigate('/login')}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;