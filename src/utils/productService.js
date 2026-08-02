import api from './api.js';

export const productService = {
  /**
   * Fetches all medicines for billing.
   *
   * This used to call `/products`, which the API does not implement, so the
   * invoice form silently failed to load its product list. `/medicines` is the
   * real endpoint and returns { status, count, data } — the same shape the
   * caller already reads via `response.data.data`.
   *
   * @returns {Promise} Axios promise response.
   */
  getAllProducts: () => {
    return api.get('/medicines');
  },
};
