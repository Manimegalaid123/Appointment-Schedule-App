import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Calendar, ArrowRight, AlertCircle, User, Building } from 'lucide-react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api'; // backend URL

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      const role = res.data.role;
      const name = encodeURIComponent(res.data.name || 'user');
      const businessType = res.data.businessType || 'business';
      const businessName = encodeURIComponent(res.data.businessName || name);
      const businessEmail = encodeURIComponent(formData.email);
      // After successful login/signup
      localStorage.setItem('email', formData.email); // user.email is the logged-in customer's email
      if (role === 'customer') {
        navigate(`/customer-dashboard/${name}`);
      } else if (role === 'manager') {
        if (businessType === 'salon') navigate(`/salon-dashboard/${businessEmail}`);
        else if (businessType === 'consultancy') navigate(`/consultant-dashboard/${formData.email}`);
        else navigate(`/manager-dashboard/${name}`);
      } else if (role === 'consultant') {
        navigate(`/consultant-dashboard/${formData.email}`);
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Invalid credentials. Please check your email and password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
  };

  return (
    <div className="login-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="brand-icon"><Calendar size={24} /></div>
            <span className="brand-text">AppointEase</span>
          </div>
          <div className="nav-actions">
            <span className="nav-text">New here?</span>
            <button className="nav-button" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="form-container">
          {/* Header */}
          <div className="header">
            <div className="header-icon"><Lock size={32} /></div>
            <h1 className="header-title">Welcome Back</h1>
            <p className="header-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <div className="form-card">
            {errors.submit && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <p>{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              {/* User Type Selection */}
              <div className="user-type-section">
                <label className="field-label">I am a</label>
                <div className="user-type-buttons">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('customer')}
                    className={`user-type-btn ${formData.role === 'customer' ? 'active' : ''}`}
                    disabled={isLoading}
                  >
                    <User size={20} /><span>Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className={`user-type-btn ${formData.role === 'manager' ? 'active' : ''}`}
                    disabled={isLoading}
                  >
                    <Building size={20} /><span>Business Owner</span>
                  </button>
                </div>
              </div>

              {/* Email Field */}
              <div className="login-form-group">
                <label className="field-label"><Mail size={16}/> Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`login-form-input ${errors.email ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.email && <p className="field-error"><AlertCircle size={14}/>{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div className="login-form-group">
                <label className="field-label"><Lock size={16}/> Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`login-form-input ${errors.password ? 'error' : ''}`}
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" disabled={isLoading}>
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
                {errors.password && <p className="field-error"><AlertCircle size={14}/>{errors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <div className="checkbox-group">
                  <input type="checkbox" id="remember-me" className="checkbox" disabled={isLoading}/>
                  <label htmlFor="remember-me" className="checkbox-label">Remember me</label>
                </div>
                <button type="button" className="link-button" disabled={isLoading} onClick={() => navigate('/forgot-password')}>Forgot password?</button>
              </div>

              {/* Login Button */}
              <button type="submit" disabled={isLoading} className="submit-button">
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="footer-link">
            <p>Don't have an account? <button className="link-button primary" onClick={() => navigate('/signup')}>Create one here</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;