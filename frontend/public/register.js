//registrar usuario en base de datos

    document.getElementById("registrationForm").addEventListener("submit",async  function(event) {
            let isValid = true;
        
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const role = document.getElementById("role").value;

            // Validar nombre de usuario (mínimo 5 caracteres)
            if (username.length < 5) {
                alert("El nombre de usuario debe tener al menos 5 caracteres.");
                isValid = false;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                alert("Por favor ingresa un correo electrónico válido.");
                isValid = false;
            }

            if (password.length < 4) {
                alert("La contraseña debe tener al menos 4 caracteres.");
                isValid = false;
            }

            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden.");
                isValid = false;
                
            }

            // Prevenir el envío del formulario
            if (!isValid) {
                event.preventDefault();
                
            }


    if(isValid){ 
            const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({username:username, email: email, password: password, role:role }) });
    if (response.ok) {
      const data = await response.json();
      alert(data.message);}
    }

        });