import React, { useState } from 'react';
import { User, Building, Mail, Phone, MapPin, Lock, Calendar, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';

const BASE_URL = 'http://localhost:5000/api'; // backend URL

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
  const [businessData, setBusinessData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const businessFields = {
    salon: {
      businessName: '',
      businessAddress: '',
      services: '',
      workingHours: ''
    },
    hospital: {
      businessName: '',
      specialization: '',
      doctors: '',
      workingHours: ''
    },
    education: {
      businessName: '',
      courses: '',
      businessAddress: '',
      workingHours: ''
    },
    consultancy: {
      businessName: '',
      services: '',
      businessAddress: '',
      workingHours: ''
    }
  };

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
      if (!formData.address) newErrors.address = 'Address is required';
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
      if (businessType) {
        Object.keys(businessFields[businessType]).forEach(field => {
          if (!businessData[field]) {
            newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
          }
        });
      }
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

  // Corrected handleSubmit with business data processing
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      // Prepare businessData for backend
      let processedBusinessData = { ...businessData };
      if (businessType === 'salon' || businessType === 'consultancy') {
        if (processedBusinessData.services) {
          processedBusinessData.services = processedBusinessData.services
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
      }
      if (businessType === 'hospital' && processedBusinessData.doctors) {
        processedBusinessData.doctors = processedBusinessData.doctors
          .split(',')
          .map(d => d.trim())
          .filter(Boolean);
      }
      if (businessType === 'education' && processedBusinessData.courses) {
        processedBusinessData.courses = processedBusinessData.courses
          .split(',')
          .map(c => c.trim())
          .filter(Boolean);
      }

      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...userFormData } = formData;

      const userData = {
        ...userFormData,
        role,
        ...(role === 'manager' && { businessType, businessData: processedBusinessData })
      };

      try {
        const res = await axios.post('http://localhost:5000/api/auth/signup', userData);
        alert(res.data.message || `Account created successfully! Welcome ${role === 'customer' ? 'Customer' : 'Business Manager'}!`);

        if (role === 'manager' && businessType === 'salon') {
          const businessEmail = encodeURIComponent(formData.email);
          navigate(`/salon-dashboard/${businessEmail}`);
        } else if (role === 'manager' && businessType === 'consultancy') {
          const businessEmail = encodeURIComponent(formData.email);
          navigate(`/consultant-dashboard/${businessEmail}`);
        } else if (role === 'customer') {
          const customerName = userFormData.name ? encodeURIComponent(userFormData.name) : 'customer';
          navigate(`/customer-dashboard/${customerName}`);
          
        } else {
          navigate('/login');
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Signup failed. Please try again.';
        alert(msg);
      }
    }
  };

  const handleBusinessDataChange = (field, value) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldPlaceholder = (field) => {
    const placeholders = {
      businessName: 'e.g., Glamour Salon & Spa',
      businessAddress: 'e.g., 123 Beauty Street, Downtown',
      services: 'e.g., Haircut, Hair Color, Manicure (comma separated)',
      workingHours: 'e.g., 9:00 AM - 7:00 PM',
      specialization: 'e.g., General Medicine, Cardiology',
      doctors: 'e.g., Dr. Smith, Dr. Johnson (comma separated)',
      courses: 'e.g., Web Development, Data Science (comma separated)'
    };
    return placeholders[field] || field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
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
              <span className="brand-text">AppointEase</span>
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

          <div className="signup-form-container">
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
                      onChange={(e) => handleFormDataChange('name', e.target.value)}
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
                      onChange={(e) => handleFormDataChange('email', e.target.value)}
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
                      onChange={(e) => handleFormDataChange('phone', e.target.value)}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                    />
                    {errors.phone && <p className="error-message">{errors.phone}</p>}
                  </div>

                  <div className="form-field">
                    <label className="field-label">
                      <MapPin className="label-icon" />
                      Address *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) => handleFormDataChange('address', e.target.value)}
                      className={`form-input ${errors.address ? 'error' : ''}`}
                    />
                    {errors.address && <p className="error-message">{errors.address}</p>}
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
                      onChange={(e) => handleFormDataChange('password', e.target.value)}
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
                      onChange={(e) => handleFormDataChange('confirmPassword', e.target.value)}
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
                  <div className="business-type-grid">
                    {Object.keys(businessFields).map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setBusinessType(type);
                          setBusinessData(businessFields[type]);
                        }}
                        className={`business-type-card ${businessType === type ? 'selected' : ''}`}
                      >
                        <h4 className="business-type-title">{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                        <p className="business-type-description">
                          {type === 'salon' && 'Beauty & wellness services'}
                          {type === 'hospital' && 'Healthcare & medical'}
                          {type === 'education' && 'Learning & training'}
                          {type === 'consultancy' && 'Professional services'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {errors.businessType && <p className="error-message">{errors.businessType}</p>}
                </div>

                {businessType && (
                  <div className="business-details-section">
                    <h4 className="business-details-title">Business Details</h4>
                    {Object.keys(businessFields[businessType]).map((field) => (
                      <div key={field} className="form-field">
                        <label className="field-label">
                          {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} *
                        </label>
                        {field === 'services' || field === 'courses' || field === 'doctors' ? (
                          <textarea
                            placeholder={getFieldPlaceholder(field)}
                            value={businessData[field] || ''}
                            onChange={(e) => handleBusinessDataChange(field, e.target.value)}
                            className={`form-textarea ${errors[field] ? 'error' : ''}`}
                            rows="3"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={getFieldPlaceholder(field)}
                            value={businessData[field] || ''}
                            onChange={(e) => handleBusinessDataChange(field, e.target.value)}
                            className={`form-input ${errors[field] ? 'error' : ''}`}
                          />
                        )}
                        {errors[field] && <p className="error-message">{errors[field]}</p>}
                      </div>
                    ))}
                  </div>
                )}
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
                  type="button"
                  onClick={handleSubmit}
                  className="nav-button submit-button"
                >
                  Create Account
                  <Check className="button-icon" />
                </button>
              )}
            </div>
          </div>

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

// After successful login API call:
// const response = await axios.post('/api/auth/login', { email, password });
// if (response.data.success) {
//   const user = response.data.user; // or however your backend returns the user object
//   localStorage.setItem('name', user.name);
//   localStorage.setItem('email', user.email);
//   // ...redirect or update UI...
// }