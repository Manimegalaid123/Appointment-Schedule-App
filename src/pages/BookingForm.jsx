import React, { useState, useEffect } from 'react';

function generateTimeSlots(start, end) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  while (h < endH || (h === endH && m <= endM)) {
    const hour = h.toString().padStart(2, '0');
    const min = m.toString().padStart(2, '0');
    slots.push(`${hour}:${min}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
  }
  return slots;
}

const BookingForm = ({ business, service, workingHours, onClose }) => {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const customerName = localStorage.getItem('name');
  const customerEmail = localStorage.getItem('email');

  const slots = workingHours
    ? generateTimeSlots(
        workingHours.start || '09:00',
        workingHours.end || '19:00'
      )
    : generateTimeSlots('09:00', '19:00');

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      return;
    }
    const fetchBooked = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/appointments/booked-times/check?businessEmail=${business.email}&service=${service}&date=${date}`);
        const data = await res.json();
        if (data.success) setBookedSlots(data.bookedTimes || []);
        else setBookedSlots([]);
      } catch {
        setBookedSlots([]);
      }
    };
    fetchBooked();
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
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={isBooked}
                  style={{
                    background: selectedSlot === slot ? '#6366f1' : isBooked ? '#e5e7eb' : '#f3f4f6',
                    color: selectedSlot === slot ? '#fff' : isBooked ? '#aaa' : '#222',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: isBooked ? 'not-allowed' : 'pointer'
                  }}
                >
                  {new Date(`2020-01-01T${slot}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isBooked ? ' (Booked)' : ''}
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