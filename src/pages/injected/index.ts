console.log('[injected]');

const originalRequest = window.ethereum.request.bind(window.ethereum);

window.ethereum.request = async request => {
  console.log('[injected]: intercepted request', JSON.stringify(request));
  return originalRequest(request);
};
