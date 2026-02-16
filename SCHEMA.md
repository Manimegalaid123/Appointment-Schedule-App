# Appointend Database Schema Documentation

## Project Overview
Appointend is an appointment booking application with MongoDB as the database, featuring users, businesses, services, and appointments.

---

## Database Collections

### 1. **Users Collection**

Stores customer and manager/business profiles.

```json
{
  "_id": ObjectId,
  "name": String (required),
  "email": String (required, unique),
  "phone": String,
  "password": String (required, hashed),
  "role": Enum ["customer", "manager"] (required),
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
- `email` (unique)

**Relationships:**
- Managers can own multiple Businesses
- Customers can create multiple Appointments

---

### 2. **Businesses Collection**

Stores salon/business information with operating hours and configurations.

```json
{
  "_id": ObjectId,
  "businessName": String (required),
  "businessType": String (required),
  "businessAddress": String (required),
  "phone": String (required),
  "email": String (required, unique),
  "workingHours": String (required),
  "imageUrl": String,
  "services": [String],
  "bufferTime": Number (default: 0, in minutes),
  
  "breaks": [
    {
      "day": Enum ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "startTime": String ("HH:MM" format),
      "endTime": String ("HH:MM" format),
      "breakType": Enum ["Lunch", "Leave", "Break"],
      "description": String
    }
  ],
  
  "reminderSettings": {
    "enableEmailReminder": Boolean (default: true),
    "enableSMSReminder": Boolean (default: false),
    "reminderBefore24h": Boolean (default: true),
    "reminderBefore1h": Boolean (default: true)
  },
  
  "emailCredentials": {
    "smtpEmail": String (optional),
    "smtpPassword": String (optional),
    "useDefaultSMTP": Boolean (default: true)
  },
  
  "averageRating": Number (min: 0, max: 5, default: 0),
  "totalRatings": Number (default: 0),
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
- `email` (unique)

**Relationships:**
- One Business has many Services
- One Business has many Appointments

---

### 3. **Services Collection**

Stores available services offered by businesses.

```json
{
  "_id": ObjectId,
  "business": ObjectId (ref: 'Business', required),
  "name": String (required),
  "description": String,
  "price": Number (required),
  "duration": Number (required, in minutes),
  "imageUrl": String,
  "status": Enum ["active", "inactive"] (default: "active"),
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
- `business` (foreign key)

**Relationships:**
- Each Service belongs to one Business
- One Service can have multiple Appointments

---

### 4. **Appointments Collection**

Stores booking information and appointment details.

```json
{
  "_id": ObjectId,
  "customerName": String (required),
  "customerEmail": String (required),
  "customerPhone": String,
  "businessEmail": String (required),
  "businessName": String,
  "businessAddress": String,
  "service": String (required),
  "date": String (required),
  "time": String (required),
  "notes": String,
  "status": Enum ["pending", "accepted", "completed", "cancelled", "rejected"] (default: "pending"),
  
  "remindersSent": {
    "reminder24h": Boolean (default: false),
    "reminder1h": Boolean (default: false),
    "sentAt24h": Date (default: null),
    "sentAt1h": Date (default: null)
  },
  
  "rating": {
    "rating": Number (min: 1, max: 5, default: null),
    "comment": String (default: ""),
    "ratedAt": Date (default: null)
  },
  
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
- `businessEmail`
- `customerEmail`
- `status`

**Status Workflow:**
```
pending → accepted → completed → (rated)
       ↓
     rejected
       ↓
     cancelled
```

---

## Entity Relationship Diagram

```
User (Manager)
    ↓ (owns)
Business
    ↓ (has)
Service
    ↓ (booked via)
Appointment ← (Customer)User
```

---

## API Schema Overview

### Authentication Routes
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - Logout

### Appointment Routes
- `POST /appointments` - Create appointment
- `GET /appointments` - List appointments
- `PUT /appointments/:id` - Update appointment status
- `DELETE /appointments/:id` - Cancel appointment
- `POST /appointments/:id/rate` - Rate appointment

### Business Routes
- `POST /businesses` - Create business
- `GET /businesses` - List all businesses
- `GET /businesses/:id` - Get business details
- `PUT /businesses/:id` - Update business
- `DELETE /businesses/:id` - Delete business

### Service Routes
- `POST /services` - Add service to business
- `GET /services/:businessId` - Get services for business
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### User Routes
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile

---

## Key Features

### Reminder System
- Automated reminders 24 hours and 1 hour before appointments
- Tracks which reminders have been sent
- Configurable per business

### Break Time Management
- Define breaks/lunch time per day
- Prevents booking during break hours
- Buffer time between appointments for cleanup

### Rating System
- Customers can rate appointments 1-5 stars
- Businesses have average rating tracking
- Comments supported

### Multi-role Support
- **Customer:** Creates and manages appointments
- **Manager:** Operates business and manages services

---

## Data Validation Rules

### User
- Email must be unique
- Password must be hashed
- Role must be 'customer' or 'manager'

### Business
- Email must be unique
- Phone format validation recommended
- Working hours format: TBD (suggest "09:00-18:00")

### Service
- Price must be positive number
- Duration must be positive (minutes)
- Business reference must exist

### Appointment
- Date format: String (recommend ISO 8601: "YYYY-MM-DD")
- Time format: String ("HH:MM" in 24-hour format)
- Status transitions must follow workflow
- Rating only allowed after appointment is completed

---

## Future Enhancements

- Add SMS reminder support
- Connect to payment gateway
- Implement customer reviews/testimonials
- Add business analytics/reporting
- Calendar availability sync
- Multi-language support
- Notification preferences per user
