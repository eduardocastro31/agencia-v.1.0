import Auth from './auth.js';

async function apiRequest(url, options = {}) {
  // Agregar el token al encabezado
  if (!options.headers) options.headers = {};
  const token = Auth.getToken();
  console.log(`Invoncando con Token ${token}`);
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, options);

  //refrescarlo
  if (response.status === 401) {
    console.log('Token expirado, intentando refrescar...');

    const newToken = await Auth.refreshToken();
    if (newToken) {
      options.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, options); 
    } else {
      console.log('Sesión expirada, redirigiendo al login...');
     
    }
  }

  return response.json();
}


export default apiRequest;
