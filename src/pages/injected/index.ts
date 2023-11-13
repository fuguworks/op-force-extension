console.log('[injected]');

const originalRequest = window.ethereum.request.bind(window.ethereum);

window.ethereum.request = async request => {
  if (request.method === 'eth_sendTransaction') {
    const signRequest = request.params[0];
    var event = new CustomEvent('SignRequest', {
      detail: JSON.stringify(signRequest),
    });
    console.log('[injected] intercepted request', JSON.stringify(request));
    window.dispatchEvent(event);
    return;
  }

  return originalRequest(request);
};

window.addEventListener('Confirm', async (message: CustomEvent) => {
  console.log('[injected]: confirm', message, JSON.parse(message.detail));
  await originalRequest({
    method: 'eth_sendTransaction',
    params: [JSON.parse(message.detail)],
  });
});

window.addEventListener('Reject', async message => {
  console.log('[injected]: reject', message);
});
