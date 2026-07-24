const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

// TODO: Replace with production HTTPS URL before deployment
export const environment = {
  production: true,
  apiBaseUrl: getApiBaseUrl(),
};
