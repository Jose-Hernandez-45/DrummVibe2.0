document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registroForm');
  const usuarioInput = document.getElementById('usuario');
  const correoInput = document.getElementById('correo');
  const contrasenaInput = document.getElementById('contrasena');
  const togglePassword = document.getElementById('togglePassword');
  const message = document.getElementById('message');

  // Alternar visibilidad de la contraseña
  togglePassword?.addEventListener('click', () => {
    const type = contrasenaInput.type === 'password' ? 'text' : 'password';
    contrasenaInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  // Validación simple y útil
  function validarCampos(usuario, correo, contrasena) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!usuario || usuario.length < 3) {
      mostrarMensaje('El usuario debe tener al menos 3 caracteres.', false);
      return false;
    }

    if (!correo || !emailRegex.test(correo)) {
      mostrarMensaje('Ingresa un correo electrónico válido.', false);
      return false;
    }

    if (!contrasena || contrasena.length < 6) {
      mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', false);
      return false;
    }

    return true;
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value;

    if (!validarCampos(usuario, correo, contrasena)) return;

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        mostrarMensaje(data.message || 'Registro exitoso.', true);
        form.reset();
      } else {
        mostrarMensaje(data.error || 'Error en el registro.', false);
      }
    } catch (error) {
      mostrarMensaje('Error en la conexión con el servidor.', false);
      console.error(error);
    }
  });

  function mostrarMensaje(texto, exito) {
    message.textContent = texto;
    message.style.color = exito ? '#49cc21' : '#da0700';
  }
});
