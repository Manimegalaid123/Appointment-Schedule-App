import React, { useState, useEffect } from 'react';

function parseWorkingHours(workingHours) {
  if (!workingHours) {
    return { start: '09:00', end: '19:00' };
  }

  // If it's already an object with start and end, use it
  if (typeof workingHours === 'object' && workingHours.start && workingHours.end) {
    return {
      start: convertTo24Hour(workingHours.start),
      end: convertTo24Hour(workingHours.end)
    };
  }

  // If it's a string like "8:00 AM - 6:00 PM" or "08:00 - 18:00"
  if (typeof workingHours === 'string') {
    const parts = workingHours.split('-').map(p => p.trim());
    if (parts.length === 2) {
      return {
        start: convertTo24Hour(parts[0]),
        end: convertTo24Hour(parts[1])
      };
    }
  }

  // Fallback to default
  return { start: '09:00', end: '19:00' };
}

function convertTo24Hour(timeStr) {
  if (!timeStr) return '09:00';
  
  timeStr = timeStr.trim();
  
  // If already in 24-hour format (HH:MM)
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  // Parse 12-hour format (e.g., "8:00 AM", "6:00 PM")
  const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = timeStr.match(regex);
  
  if (!match) return '09:00';
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function generateTimeSlots(start, end, serviceDuration = 30, bufferTime = 0) {
  const slots = [];
  const interval = serviceDuration + bufferTime; // Total time per appointment (service + buffer)
  
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const totalMinutesEnd = endH * 60 + endM;

  while (true) {
    const totalMinutes = h * 60 + m;
    const appointmentEndTime = totalMinutes + serviceDuration;
    
    // Only show slot if appointment can fit within working hours
    if (appointmentEndTime <= totalMinutesEnd) {
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      slots.push(`${hour}:${min}`);
    } else {
      break;
    }

    // Move to next slot
    m += interval;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
    
    if (h > endH) break;
  }
  return slots;
}

// Check if a time slot falls within any break period
function isTimeInBreak(timeSlot, breaks) {
  return breaks.some(br => {
    const slotTime = timeSlot; // "HH:mm" format
    const startTime = br.startTime; // "HH:mm" format
    const endTime = br.endTime; // "HH:mm" format
    
    return slotTime >= startTime && slotTime < endTime;
  });
}

const BookingForm = ({ business, service, workingHours, onClose, serviceDuration = 30, bufferTime = 0 }) => {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [breakTimes, setBreakTimes] = useState([]);

  const customerName = localStorage.getItem('name');
  const customerEmail = localStorage.getItem('email');

  // Parse working hours properly
  const parsedHours = parseWorkingHours(workingHours);
  
  // Generate slots based on service duration and buffer time
  const slots = generateTimeSlots(parsedHours.start, parsedHours.end, serviceDuration, bufferTime);

  // Fetch booked slots and break times when date changes
  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      setBreakTimes([]);
      return;
    }
    const fetchData = async () => {
      try {
        // Fetch booked times
        const bookedRes = await fetch(`http://localhost:5000/api/appointments/booked-times/check?businessEmail=${business.email}&service=${service}&date=${date}`);
        const bookedData = await bookedRes.json();
        if (bookedData.success) setBookedSlots(bookedData.bookedTimes || []);
        else setBookedSlots([]);

        // Fetch break times
        const breakRes = await fetch(`http://localhost:5000/api/appointments/break-times/check?businessEmail=${business.email}&date=${date}`);
        const breakData = await breakRes.json();
        if (breakData.success) setBreakTimes(breakData.breakTimes || []);
        else setBreakTimes([]);
      } catch (err) {
        console.error('Error fetching availability data:', err);
        setBookedSlots([]);
        setBreakTimes([]);
      }
    };
    fetchData();
  }, [date, business.email, service]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      console.log({
        businessEmail: business.email,
        service,
        date,
        time: selectedSlot,
        notes,
        customerName,
        customerEmail
      });
      const res = await fetch('http://localhost:5000/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessEmail: business.email,
          service: service,
          date,
          time: selectedSlot,
          notes,
          customerName,
          customerEmail
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to book appointment.');
        return;
      }

      setSuccess('Appointment booked successfully!');
      setTimeout(onClose, 1500);
    } catch {
      setError('Failed to book appointment.');
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', padding: 16, marginTop: 8 }}>
      <h4>Book {service}</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Date: </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label>Time: </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
            {slots.map(slot => {
              const isBooked = bookedSlots.includes(slot);
              const isDuringBreak = isTimeInBreak(slot, breakTimes);
              const isUnavailable = isBooked || isDuringBreak;
              const breakInfo = breakTimes.find(br => slot >= br.startTime && slot < br.endTime);
              
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={isUnavailable}
                  title={isDuringBreak ? `${breakInfo?.breakType || 'Break'}: ${breakInfo?.description || ''}` : isBooked ? 'Already booked' : ''}
                  style={{
                    background: selectedSlot === slot ? '#6366f1' : isUnavailable ? '#e5e7eb' : '#f3f4f6',
                    color: selectedSlot === slot ? '#fff' : isUnavailable ? '#aaa' : '#222',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: isUnavailable ? 'not-allowed' : 'pointer'
                  }}
                >
                  {new Date(`2020-01-01T${slot}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isBooked && ' (Booked)'}
                  {isDuringBreak && ` (${breakInfo?.breakType || 'Break'})`}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label>Notes: </label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button type="submit" disabled={!selectedSlot}>Book</button>
        <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
    </div>
  );
};

export default BookingForm;