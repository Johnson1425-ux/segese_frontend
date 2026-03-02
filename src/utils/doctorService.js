import api from './api.js';

export const doctorService = {
  // Get all doctors
  getAllDoctors: async () => {
    const response = await api.get('/doctors');
    return response.data;
  },

  getDoctorQueue: async () => {
    const response = await api.get('/doctors/my-queue?');
    return response.data;
  },

  startVisit: async (visitId) => {
    const response = await api.patch(`/doctors/visits/${visitId}/start`);
    return response.data;
  },

  // Get a single doctor by ID
  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  // Create a new doctor
  createDoctor: async (doctorData) => {
    const response = await api.post('/doctors', doctorData);
    return response.data;
  },

  // Update a doctor
  updateDoctor: async (id, doctorData) => {
    const response = await api.put(`/doctors/${id}`, doctorData);
    return response.data;
  },

  // Delete a doctor
  deleteDoctor: async (id) => {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
  },
};
