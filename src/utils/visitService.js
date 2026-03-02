import api from './api.js';

export const visitService = {
  getAllVisits: async (params = {}) => {
    const response = await api.get('/visits', { params });
    return response.data;
  },

  getActiveVisits: async () => {
    const response = await api.get('/visits/active');
    return response.data;
  },

  getVisitById: async (id) => {
    const response = await api.get(`/visits/${id}`);
    return response.data;
  },

  startVisit: async (visitData) => {
    const response = await api.post('/visits', visitData);
    return response.data;
  },

  endVisit: async (id, notes) => {
    const response = await api.put(`/visits/${id}/end`, { notes });
    return response.data;
  },
  
  updateVisit: async (id, visitData) => {
    const response = await api.put(`/visits/${id}`, visitData);
    return response.data;
  },

  // --- NEW METHODS ---
  updateVitals: async ({ visitId, vitalsData }) => {
    const response = await api.post(`/visits/${visitId}/vitals`, vitalsData);
    return response.data;
  },

  updateDiagnosis: async ({ visitId, diagnosisData }) => {
    const response = await api.post(`/visits/${visitId}/diagnosis`, diagnosisData);
    return response.data;
  },

  addLabOrder: async ({ visitId, orderData }) => {
  const response = await api.post(`/visits/${visitId}/lab-orders`, orderData);
  return response.data;
  },

  addPrescription: async ({ visitId, prescriptionData }) => {
    const response = await api.post(`/visits/${visitId}/prescriptions`, prescriptionData);
    return response.data;
  },

  getPrescriptions: async (id) => {
    const response = await api.get(`/visits/${id}/prescriptions`);
    response.data;
  }
};