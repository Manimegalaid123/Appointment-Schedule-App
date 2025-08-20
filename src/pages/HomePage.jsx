import React from 'react';
import './Home.css';


import { Calendar, Clock, User, Building, Phone, Mail, MapPin, CheckCircle, Star, ArrowRight, Users, Briefcase, GraduationCap, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-items">
            <div className="logo-section">
              <div className="logo-icon">
                <Calendar className="icon" />
              </div>
              <span className="logo-text">
                AppointEase
              </span>
            </div>
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <a href="#business-types" className="nav-link">Business Types</a>
             
            </div>
            <div className="nav-buttons">
              <button 
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="get-started-btn"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-heading">
                <h1 className="main-title">
                  Schedule
                  <span className="gradient-text">
                    Appointments
                  </span>
                  with Ease
                </h1>
                <p className="hero-description">
                  Connect customers with businesses for seamless appointment booking. 
                  Whether you're running a salon, hospital, or consultancy - we've got you covered.
                </p>
              </div>
              
              <div className="hero-buttons">
                <button 
                  className="primary-btn"
                  onClick={() => navigate('/signup')}
                >
                 Get Started
                  <ArrowRight className="btn-icon" />
                </button>
             
              </div>

              <div className="hero-features">
                <div className="feature-item">
                  <CheckCircle className="check-icon" />
                  <span>Free to use</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="check-icon" />
                  <span>Instant confirmation</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="check-icon" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="appointment-card">
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">Book Your Appointment</h3>
                    <span className="availability-badge">Available</span>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-item">
                      <Building className="detail-icon building" />
                      <span>Glamour Salon & Spa</span>
                    </div>
                    <div className="detail-item">
                      <MapPin className="detail-icon location" />
                      <span>123 Beauty Street, Downtown</span>
                    </div>
                    <div className="detail-item">
                      <Calendar className="detail-icon calendar" />
                      <span>Tomorrow, 2:00 PM</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="service-tags">
                      <span className="service-tag tag-blue">Haircut</span>
                      <span className="service-tag tag-teal">Styling</span>
                      <span className="service-tag tag-pink">Manicure</span>
                    </div>
                    <button className="book-btn">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Calendar Animation */}
              <div className="floating-calendar">
                <div className="calendar-widget">
                  <div className="calendar-header">
                    <span className="calendar-month">December 2025</span>
                    <div className="appointment-indicator">
                      <span className="time">2:30 PM</span>
                      <span className="type">Doctor Consultation</span>
                      <span className="status">Confirmed ✓</span>
                    </div>
                  </div>
                  <div className="calendar-grid">
                    <div className="weekdays">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div className="dates">
                      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                      <span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span>
                      <span>15</span><span className="selected-date">16</span><span>17</span><span>18</span><span className="highlighted-date">19</span><span>20</span><span>21</span>
                      <span>22</span><span className="today">23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span>
                      <span>29</span><span>30</span><span>31</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="floating-element element1"></div>
              <div className="floating-element element2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-content">
          <div className="section-header">
            <h2 className="section-title">
              Why Choose AppointmentHub?
            </h2>
            <p className="section-description">
              Streamline your booking process with our powerful yet simple appointment management system
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card card-blue">
              <div className="feature-icon icon-blue">
                <Calendar className="icon" />
              </div>
              <h3 className="feature-title">Easy Scheduling</h3>
              <p className="feature-description">
                Book appointments in seconds with our intuitive interface. View available slots, 
                select your preferred time, and get instant confirmation.
              </p>
            </div>

            <div className="feature-card card-teal">
              <div className="feature-icon icon-teal">
                <Building className="icon" />
              </div>
              <h3 className="feature-title">Multiple Business Types</h3>
              <p className="feature-description">
                From salons and hospitals to education centers and consultancies. 
                Our platform adapts to any business model seamlessly.
              </p>
            </div>

            <div className="feature-card card-green">
              <div className="feature-icon icon-green">
                <User className="icon" />
              </div>
              <h3 className="feature-title">Smart Management</h3>
              <p className="feature-description">
                Business owners get powerful tools to manage appointments, 
                send confirmations, and track their booking analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-content">
          <div className="section-header">
            <h2 className="section-title">
              How It Works
            </h2>
            <p className="section-description">
              Get started in three simple steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="connecting-line line1"></div>
            <div className="connecting-line line2"></div>

            <div className="step-item">
              <div className="step-number number-blue">
                <span>1</span>
              </div>
              <h3 className="step-title">Choose Your Role</h3>
              <p className="step-description">
                Sign up as a Customer to book appointments or as a Business Manager to offer your services
              </p>
            </div>

            <div className="step-item">
              <div className="step-number number-teal">
                <span>2</span>
              </div>
              <h3 className="step-title">Browse & Book</h3>
              <p className="step-description">
                Customers can browse businesses, check availability, and book appointments instantly
              </p>
            </div>

            <div className="step-item">
              <div className="step-number number-green">
                <span>3</span>
              </div>
              <h3 className="step-title">Manage & Confirm</h3>
              <p className="step-description">
                Business owners receive requests and can accept, reject, or reschedule with email notifications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section id="business-types" className="business-types-section">
        <div className="section-content">
          <div className="section-header">
            <h2 className="section-title">
              Perfect For Every Business
            </h2>
            <p className="section-description">
              Our platform adapts to your specific business needs
            </p>
          </div>

          <div className="business-grid">
            <div className="business-card card-pink">
              <div className="business-icon icon-pink">
                <Users className="icon" />
              </div>
              <h3 className="business-title">Salons & Spas</h3>
              <p className="business-subtitle">
                Hair, beauty, and wellness services
              </p>
              <ul className="business-features">
                <li>• Service management</li>
                <li>• Staff scheduling</li>
                <li>• Customer preferences</li>
              </ul>
            </div>

            <div className="business-card card-blue">
              <div className="business-icon icon-blue">
                <Stethoscope className="icon" />
              </div>
              <h3 className="business-title">Healthcare</h3>
              <p className="business-subtitle">
                Hospitals, clinics, and medical centers
              </p>
              <ul className="business-features">
                <li>• Doctor specializations</li>
                <li>• Patient management</li>
                <li>• Medical records</li>
              </ul>
            </div>

            <div className="business-card card-green">
              <div className="business-icon icon-green">
                <GraduationCap className="icon" />
              </div>
              <h3 className="business-title">Education</h3>
              <p className="business-subtitle">
                Schools, tutoring, and training centers
              </p>
              <ul className="business-features">
                <li>• Course scheduling</li>
                <li>• Student tracking</li>
                <li>• Resource booking</li>
              </ul>
            </div>

            <div className="business-card card-purple">
              <div className="business-icon icon-purple">
                <Briefcase className="icon" />
              </div>
              <h3 className="business-title">Professional</h3>
              <p className="business-subtitle">
                Lawyers, consultants, and advisors
              </p>
              <ul className="business-features">
                <li>• Consultation booking</li>
                <li>• Case management</li>
                <li>• Client communications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Transform Your Appointment Booking?
          </h2>
          <p className="cta-description">
            Join thousands of businesses and customers who trust AppointmentHub 
            for their scheduling needs
          </p>
          <div className="cta-buttons">
            <button 
              className="cta-primary"
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
            </button>
            <button 
              className="cta-secondary"
              onClick={() => navigate('/signup')}
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <Calendar className="icon" />
                </div>
                <span className="footer-logo-text">AppointmentHub</span>
              </div>
              <p className="footer-description">
                Making appointment scheduling simple and efficient for everyone.
              </p>
              <div className="footer-social">
                <div className="social-icon">
                  <Mail className="icon" />
                </div>
                <div className="social-icon">
                  <Phone className="icon" />
                </div>
              </div>
            </div>

            <div className="footer-section">
              <h3 className="footer-title">Platform</h3>
              <ul className="footer-links">
                <li><a href="#" onClick={() => navigate('/signup')}>For Customers</a></li>
                <li><a href="#" onClick={() => navigate('/signup')}>For Businesses</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Features</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-title">Support</h3>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">API Docs</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-title">Company</h3>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">© 2024 AppointmentHub. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;