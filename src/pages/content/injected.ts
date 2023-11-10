import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';

async function toggleTheme() {
  console.log('initial theme', await exampleThemeStorage.get());
  exampleThemeStorage.toggle();
  console.log('toggled theme', await exampleThemeStorage.get());
}

void toggleTheme();

const originalRequest = window.ethereum.request.bind(window.ethereum);

window.ethereum.request = async request => {
  console.log('[injected]: intercepted request', JSON.stringify(request));
  return originalRequest(request);
};
