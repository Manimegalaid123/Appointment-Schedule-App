import axios from "axios";

// Default Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Appointment API
 */
export const appointmentAPI = {
  getAll: (params) => api.get("/appointments", { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post("/appointments", data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id) => api.delete(`/appointments/${id}`), // corrected
  getCustomerAppointments: () => api.get("/appointments/customer"),
  getBusinessAppointments: (params) => api.get("/appointments/business", { params }),
  getAppointments: (businessEmail) => api.get(`/appointments/${businessEmail}`).then(res => res.data),
  getAppointmentsByCustomer: (email) =>
    api.get(`/appointments/customer/${encodeURIComponent(email)}`).then(res => res.data),
};

/**
 * Business API
 */
export const businessAPI = {
  getAll: (params) => api.get("/business", { params }),
  getById: (id) => api.get(`/business/${id}`),
  getByEmail: (email) => api.get(`/business/email/${encodeURIComponent(email)}`).then(res => res.data),
  updateBusiness: (data) => api.put(`/business/${data._id}`, data).then(res => res.data),
  getMyBusiness: () => api.get("/business/my-business"),
  updateMyBusiness: (data) => api.put("/business/my-business", data),
  getByType: (type, params) => api.get(`/business/type/${type}`, { params }),
  toggleStatus: () => api.put("/business/toggle-status"),
  getStats: () => api.get("/business/stats"),
  addService: (email, service) =>
    api.post(`/business/email/${encodeURIComponent(email)}/add-service`, { service }).then(res => res.data),
};

/**
 * Service API
 */
export const serviceAPI = {
  create: (data) => api.post("/business-services", data),
  getById: (id) => api.get(`/business-services/${id}`),
  getMyServices: () => api.get("/business-services/my-services"),
  getBusinessServices: (businessId) => api.get(`/business-services/business/${businessId}`),
  update: (id, data) => api.put(`/business-services/${id}`, data),
  toggleStatus: (id) => api.put(`/business-services/${id}/toggle`),
  delete: (id) => api.delete(`/business-services/${id}`),
};

export default api;