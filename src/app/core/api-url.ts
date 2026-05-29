const productionApiUrl = 'https://gestao-controle-financeiro-api-production.up.railway.app';
const localApiUrl = 'http://127.0.0.1:8080';

const host = globalThis.location?.hostname;
const isLocalHost = host === 'localhost' || host === '127.0.0.1';

export const API_BASE_URL = isLocalHost ? localApiUrl : productionApiUrl;
