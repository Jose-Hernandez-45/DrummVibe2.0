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

  // Detectar entorno (localhost o producción)
  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com'; // ← Reemplaza con la URL real de tu backend en Render si es otra

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = form.usuario.value.trim();
    const contrasena = form.contrasena.value;

    if (!usuario || !contrasena) {
      message.textContent = 'Completa todos los campos';
      message.style.color = 'red';
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
        message.textContent = data.error || 'Error en el login';
        message.style.color = 'red';
        return;
      }

      // Guardar datos en localStorage
      localStorage.setItem('usuario', data.usuario || usuario);
      localStorage.setItem('rol', data.rol || 'usuario');

      message.textContent = data.message;
      message.style.color = 'green';

      // Redirigir según el rol
      setTimeout(() => {
        if (data.rol === 'administrador') {
          window.location.href = '../templates/adm/admin.html';
        } else {
          window.location.href = '../index.html';
        }
      }, 1000);

    } catch (error) {
      message.textContent = 'Error en la conexión con el servidor';
      message.style.color = 'red';
      console.error(error);
    }
  });
});
