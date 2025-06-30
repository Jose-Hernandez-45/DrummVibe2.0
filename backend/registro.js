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

    // Definir URL base según entorno
    const API_URL = location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : 'https://drummvibe2-0.onrender.com';

    // Enviar formulario
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = usuarioInput.value.trim();
        const correo = correoInput.value.trim();
        const contrasena = contrasenaInput.value;

        if (!usuario || !correo || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, correo, contrasena }),
            });

            const data = await res.json();
            mostrarMensaje(data.message || data.error, res.ok);

            if (res.ok) form.reset();
        } catch {
            mostrarMensaje('Error en la conexión con el servidor', false);
        }
    });

    function mostrarMensaje(texto, exito) {
        message.textContent = texto;
        message.style.color = exito ? '#49cc21' : '#da0700';
    }
});
