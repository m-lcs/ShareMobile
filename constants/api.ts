export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  console.log('API FETCH:', options?.method, endpoint);

  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options?.body instanceof FormData;
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (!isGet && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();

  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('Réponse non JSON : ' + text);
  }
  try {
    return JSON.parse(text.slice(jsonStart));
  } catch (e) {
    throw new Error('Impossible de parser le JSON : ' + text);
  }
}
