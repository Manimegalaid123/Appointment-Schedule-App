# Appointend - Project Overview for Interview

## Project Summary

**Appointend** is a full-stack web application designed to streamline appointment booking and management for service-based businesses like salons, clinics, and consulting centers. It connects customers with businesses, enabling seamless booking, reminders, and rating experiences.

---

## Problem Statement

Service-based businesses struggle with:
- Manual appointment scheduling
- Missed appointments due to no reminders
- No automated rating/feedback system
- Poor time management with break times
- Limited visibility into business performance

---

## Solution

A comprehensive platform that automates appointment scheduling, sends email reminders, manages business hours/breaks, and collects customer feedback through ratings.

---

## Project Type

**Full-Stack Web Application** (MERN-like stack with MongoDB, Express, React, Node.js)

---

## Technology Stack

### Frontend
- **Framework:** React 18+ with Vite (fast build tool)
- **Language:** JavaScript/JSX
- **Styling:** CSS
- **Routing:** React Router
- **API Communication:** Axios (API utility)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Node Mailer (automated reminders)

### Tools & Utilities
- **Version Control:** Git
- **Package Manager:** npm
- **Linting:** ESLint

---

## Core Features

### 1. **User Management**
- Customer registration & login
- Manager/Business owner registration & login
- Role-based access control (customer vs manager)
- Profile management

### 2. **Business Management**
- Business profile creation & management
- Service catalog (add, edit, delete services)
- Business hours configuration
- Break time scheduling (Lunch, Leave, Breaks per day)
- Business ratings & reviews
- Email credentials for reminder sending

### 3. **Service Management**
- Create services with price & duration
- Service descriptions and images
- Activate/deactivate services
- Service status tracking

### 4. **Appointment Booking**
- Browse available businesses & services
- Real-time availability checking
- Book appointments with date/time selection
- Customer notes/special requests
- Status tracking (pending, accepted, completed, cancelled, rejected)

### 5. **Automated Reminder System**
- Email reminders 24 hours before appointment
- Email reminders 1 hour before appointment
- Customizable reminder settings per business
- Tracks reminder delivery status

### 6. **Rating & Feedback**
- Customers can rate appointments (1-5 stars)
- Leave comments/reviews
- Business average rating calculation
- Feedback collection for service improvement

### 7. **Dashboard Features**
- **Customer Dashboard:** View bookings, ratings, history
- **Manager Dashboard:** Manage appointments, view analytics, configure business
- **Salon Dashboard:** Overview of services, break times, ratings

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login/Signup │  │ Booking Form │  │ Dashboards   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                      API Calls (Axios)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes (Auth, Appointments, Business, Services)     │   │
│  │ Controllers (Business Logic)                        │   │
│  │ Middleware (Authentication, Error Handling)        │   │
│  │ Utils (Email Reminders, Mail Service)              │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
                  ↓ Mongoose ODM
┌─────────────────────────────────────────────────────────────┐
│                  MongoDB Database                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐ ┌───────────┐   │
│  │   Users  │  │Businesses │  │Services  │ │Appointments   │
│  └──────────┘  └───────────┘  └──────────┘ └───────────┘   │
└─────────────────────────────────────────────────────────────┘

External Services:
- Email Service (SMTP) for sending reminders
```

---

## Database Schema Overview

### Collections:

1. **Users**
   - name, email, phone, password (hashed), role (customer/manager)
   - Timestamps for tracking

2. **Businesses**
   - Business details (name, type, address, phone, email)
   - Working hours, breaks scheduling
   - Services list, buffer time between appointments
   - Reminder settings, email credentials
   - Average rating & total ratings

3. **Services**
   - Belongs to a business
   - name, description, price, duration (minutes)
   - Status (active/inactive), image URL

4. **Appointments**
   - Customer info (name, email, phone)
   - Business info (email, name, address)
   - Service name, date, time, notes
   - Status workflow (pending → accepted → completed)
   - Reminder tracking (24h, 1h)
   - Rating & feedback from customer

---

## Key Workflow

```
CUSTOMER JOURNEY:
1. Sign up → 2. Login → 3. Browse businesses → 4. Select service
→ 5. Check availability → 6. Book appointment → 7. Receive reminder
→ 8. Attend appointment → 9. Rate & provide feedback

MANAGER JOURNEY:
1. Sign up → 2. Login → 3. Create business profile → 4. Add services
→ 5. Configure break times & reminders → 6. View appointments
→ 7. Accept/Reject appointments → 8. Track ratings → 9. Manage business
```

---

## Project Structure

```
Appointend/App/
├── backend/                          # Node.js/Express server
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/                 # Business logic
│   │   ├── authController.js        # User authentication
│   │   ├── appointmentController.js # Appointment CRUD
│   │   ├── businessController.js    # Business management
│   │   └── serviceController.js     # Service management
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js          # Error handling
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Service.js
│   │   └── Appointment.js
│   ├── routes/                      # API endpoints
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── businessRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── sendMail.js              # Email service
│   │   └── appointmentReminder.js   # Reminder logic
│   └── server.js                    # Entry point
│
├── src/                              # React frontend
│   ├── components/
│   │   ├── BusinessSelection.jsx
│   │   └── SalonMap.jsx
│   ├── pages/                       # Route pages
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── BookingForm.jsx
│   │   ├── CustomerDashboard.jsx
│   │   ├── ConsultantDashboard.jsx
│   │   ├── SalonDashboard.jsx
│   │   └── SalonDetails.jsx
│   ├── utils/
│   │   └── api.js                   # API client
│   ├── App.jsx                      # Main app
│   └── main.jsx                     # Entry point
│
├── public/                           # Static assets
├── package.json                      # Dependencies (Vite, React)
├── vite.config.js                   # Vite configuration
└── README.md
```

---

## Key Technologies & Why They're Used

| Technology | Purpose | Benefits |
|---|---|---|
| **React** | Frontend UI | Component-based, reusable, fast rendering |
| **Vite** | Build tool | Faster development, optimized builds |
| **Express.js** | Backend framework | Lightweight, perfect for REST APIs |
| **MongoDB** | Database | Flexible schema, great for rapid development |
| **Mongoose** | ODM | Schema validation, easier data modeling |
| **JWT** | Authentication | Stateless auth, secure API access |
| **Node Mailer** | Email service | Automated reminder system |

---

## Key Challenges Addressed

1. **Appointment Conflicts**
   - Real-time availability checking
   - Buffer time between bookings
   - Break time management

2. **Reminder System**
   - Automated emails at 24h and 1h before
   - Configurable per business
   - Tracks sent reminders to avoid duplicates

3. **User Roles**
   - Role-based access control
   - Different dashboards for customers vs managers
   - Separate workflows

4. **Data Relationships**
   - Business → Services (one-to-many)
   - Business → Appointments (one-to-many)
   - Proper MongoDB references & joins

---

## Future Enhancement Ideas

- SMS reminders in addition to email
- Payment integration (Stripe, PayPal)
- Calendar sync (Google Calendar, Outlook)
- Advanced analytics & reporting
- Waitlist management
- Video consultation support
- Multi-language support
- Mobile app development
- Business insights & analytics dashboard

---

## Development Approach

- **Agile Development** - Feature-based development
- **API-First Design** - Clear API contracts before implementation
- **Separation of Concerns** - Frontend/Backend separation
- **Database Normalization** - Proper schema design
- **Error Handling** - Comprehensive error management
- **Authentication** - Secure JWT-based auth

---

## What I Learned

✅ Full-stack web development (React + Node.js)
✅ Database design with MongoDB & Mongoose
✅ REST API development & best practices
✅ Authentication & authorization
✅ Email automation & services
✅ Component-based UI architecture
✅ Real-world problem solving
✅ Time management & scheduling logic
✅ Error handling & validation
✅ API integration with frontend

---

## Summary

Appointend demonstrates:
- **Full-stack capability** - Frontend to database
- **Real-world problem solving** - Actual business needs
- **Technical depth** - Authentication, automation, databases
- **User-centric design** - Different dashboards for different roles
- **Scalability** - Proper architecture for growth
- **Professional practices** - Error handling, validation, security
