const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

export const environment = {
  production: false,
  apiBaseUrl: getApiBaseUrl(),
};
