import api from './api.js';

export const visitService = {
  getAllVisits: async (params = {}) => {
    const response = await api.get('/visits', { params });
    return response.data;
  },

  // GET /visits already returns only active visits unless ?isActive=all is
  // passed, so the previous '/visits/active' path (which the API does not
  // implement) was never needed.
  getActiveVisits: async () => {
    const response = await api.get('/visits');
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
    // Was PUT /visits/:id/end — wrong verb and wrong path.
    const response = await api.patch(`/visits/${id}/end-visit`, { notes });
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