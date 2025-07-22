document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('message');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('contrasena');

  // Mostrar/ocultar contraseña
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

  // Detectar entorno
  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  function mostrarMensaje(texto, color = 'red') {
    message.textContent = texto;
    message.style.color = color;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = form.usuario.value.trim();
    const contrasena = form.contrasena.value;

    if (!usuario || !contrasena) {
      mostrarMensaje('Completa todos los campos.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarMensaje(data.error || 'Error en el login.');
        return;
      }

      // Guardar token, usuario y rol en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.usuario && data.rol) {
        localStorage.setItem('usuario', data.usuario);
        localStorage.setItem('rol', data.rol);
      } else {
        // Fallback si no se recibe desde el backend
        localStorage.setItem('usuario', usuario);
        localStorage.setItem('rol', 'usuario');
      }

      mostrarMensaje(data.message || 'Login exitoso.', 'green');

      // Redirigir según rol
      setTimeout(() => {
        if (data.rol === 'administrador') {
          window.location.href = '../templates/adm/admin.html';
        } else {
          window.location.href = '../index.html';
        }
      }, 1000);

    } catch (error) {
      console.error(error);
      mostrarMensaje('Error en la conexión con el servidor.');
    }
  });
});
