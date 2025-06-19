import apiRequest from './request.js';
import Auth from './auth.js';

//Inicio sesion
document.getElementById("loginBtn").addEventListener("click", async () => {
  
  const user = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const result = document.getElementById("result");

  let isValid = true;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validacion de datos con js (mail y password)
  if (!emailRegex.test(user)) {
    alert("Por favor verifique email");
    isValid = false;
  }
  if (!password) {
    alert("Por favor ingrese contraseña");
    isValid = false;
  }


  if (isValid) {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user, password: password }),
    });

    if (response.ok) {
      const data = await response.json();

       Auth.setToken(data.accessToken);
    console.log("Token almacenado");

      // Guardar datos en local session storage
      sessionStorage.setItem("token_session", data.accessToken);

  result.innerText = "Usuario Encontrado";

    }else {
      result.innerText = "Usuario No Encontrado";
    console.error("Error en el login");
  }
  } 
});


// LOGOUT - LIMPIAR TOKEN 
document.getElementById("logoutBtn").addEventListener("click", async () => {
  Auth.clearToken(); // Borrar token de memoria (del archivo Auth.js)
  await fetch("http://localhost:3000/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!sessionStorage.getItem("token_session")) {
    console.error("No hay sesiones Abiertas");
    return;
  }

  sessionStorage.removeItem("token_session");
  //Limpiar todo
 
  console.log("Sesión cerrada");

});