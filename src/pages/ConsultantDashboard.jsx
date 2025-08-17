import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, User, Mail, Phone, Check, X, Edit2, Settings, Bell, LogOut, Plus, ChevronDown, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const ConsultantDashboard = () => {
  const { consultantName } = useParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [consultantInfo, setConsultantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch consultant info from backend
  useEffect(() => {
    const fetchConsultantInfo = async () => {
      setLoading(true);
      setError('');
      try {
        // You can use consultantName as email or name, adjust endpoint as needed
        const response = await axios.get(`/api/business/email/${consultantName}`);
        if (response.data && response.data.business) {
          setConsultantInfo({
            name: response.data.business.businessName || consultantName,
            specialization: response.data.business.specialization || '',
            phone: response.data.business.phone || '',
            email: response.data.business.email || '',
            services: response.data.business.services || [],
            workingHours: response.data.business.workingHours || ''
          });
        } else {
          setError('Consultant not found.');
        }
      } catch (err) {
        setError('Error fetching consultant info.');
      } finally {
        setLoading(false);
      }
    };
    if (consultantName) fetchConsultantInfo();
  }, [consultantName]);

  // Fetch appointments for consultant
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!consultantInfo?.email) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/appointments/business/${consultantInfo.email}`);
        if (response.data && response.data.appointments) {
          setAppointments(response.data.appointments);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        setError('Error fetching appointments.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    if (consultantInfo?.email) fetchAppointments();
  }, [consultantInfo]);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    accepted: appointments.filter(a => a.status === 'accepted').length,
    rejected: appointments.filter(a => a.status === 'rejected').length
  };

  if (loading && !consultantInfo) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <RefreshCw size={48} className="spinning" />
        <h3 style={{ marginLeft: '1rem' }}>Loading consultant dashboard...</h3>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <AlertCircle size={32} style={{ color: '#ef4444', marginRight: '1rem' }} />
        <span style={{ fontSize: '1.25rem', color: '#ef4444' }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#f8fafc', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>{consultantInfo.name}</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Consultant Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Bell size={20} style={{ color: '#6b7280', cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', cursor: 'pointer' }}>
              <User size={16} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.875rem', color: '#334155' }}>Manager</span>
              <ChevronDown size={16} style={{ color: '#64748b' }} />
            </div>
            <LogOut size={20} style={{ color: '#6b7280', cursor: 'pointer' }} />
          </div>
        </div>
      </header>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem', width: '100%' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ddd6fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.total}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Appointments</p>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.pending}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Pending Requests</p>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.accepted}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Accepted</p>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.rejected}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Rejected</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            {[{ id: 'appointments', label: 'Appointments', count: stats.total }, { id: 'consultant-info', label: 'Consultant Information', count: null }, { id: 'settings', label: 'Settings', count: null }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '1rem 1.5rem', border: 'none', backgroundColor: activeTab === tab.id ? '#f8fafc' : 'transparent', color: activeTab === tab.id ? '#6366f1' : '#6b7280', borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{tab.label}{tab.count !== null && (<span style={{ backgroundColor: activeTab === tab.id ? '#6366f1' : '#e5e7eb', color: activeTab === tab.id ? 'white' : '#6b7280', borderRadius: '12px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>{tab.count}</span>)}</button>
            ))}
          </div>
          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'appointments' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                      <Calendar size={48} style={{ marginBottom: '1rem' }} />
                      <h3>No appointments yet</h3>
                      <p>New appointments will appear here when clients book through your business email.</p>
                    </div>
                  ) : (
                    appointments.map(appointment => (
                      <div key={appointment._id || appointment.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#1f2937' }}>{appointment.clientName || appointment.customerName}</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Mail size={14} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{appointment.clientEmail || appointment.customerEmail}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Phone size={14} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{appointment.clientPhone || appointment.customerPhone}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: '1rem', fontWeight: '500', margin: '0 0 0.5rem 0', color: '#374151' }}>{appointment.service}</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Calendar size={14} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{appointment.date}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Check size={14} style={{ color: '#6b7280' }} />
                                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: '500' }}>Notes:</p>
                              <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, fontStyle: 'italic' }}>{appointment.notes}</p>
                              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.5rem 0 0 0' }}>Requested: {appointment.createdAt && new Date(appointment.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #6366f1', borderRadius: '20px', color: '#6366f1' }}>
                              <AlertCircle size={16} />
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>{appointment.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'consultant-info' && consultantInfo && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0', color: '#1f2937' }}>Consultant Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Name</label>
                    <p style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', margin: 0, color: '#1f2937' }}>{consultantInfo.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Specialization</label>
                    <p style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', margin: 0, color: '#1f2937' }}>{consultantInfo.specialization}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                      <p style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', margin: 0, color: '#1f2937' }}>{consultantInfo.phone}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                      <p style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', margin: 0, color: '#1f2937' }}>{consultantInfo.email}</p>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Working Hours</label>
                    <p style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', margin: 0, color: '#1f2937' }}>{consultantInfo.workingHours}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Services</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {consultantInfo.services.map((service, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: '500' }}>{service}</span>
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0', color: '#1f2937' }}>Settings</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Settings and account management features coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;