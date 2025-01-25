import axios from 'axios';

// Create Axios instance with a base URL from environment
const apiClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3001', // Prepend API_URL to all requests
});

export default apiClient;
