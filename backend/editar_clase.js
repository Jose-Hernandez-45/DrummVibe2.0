document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEditarClase');
  const mensaje = document.getElementById('mensajeEditar');

  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    mensaje.textContent = 'ID de clase no proporcionado.';
    mensaje.style.color = 'orange';
    return;
  }

  function getToken() {
    return localStorage.getItem('token'); // O donde almacenes el JWT
  }

  // Cargar datos de la clase
  async function cargarClase() {
    try {
      const res = await fetch(`${API_URL}/clases/${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        mensaje.textContent = errorData.error || 'No se pudo cargar la clase.';
        mensaje.style.color = 'red';
        return;
      }

      const clase = await res.json();

      form['titulo'].value = clase.titulo || '';
      form['descripcion'].value = clase.descripcion || '';
      form['video'].value = clase.video || '';
      form['nivel'].value = clase.nivel || '';
    } catch (error) {
      console.error(error);
      mensaje.textContent = 'Error al cargar datos.';
      mensaje.style.color = 'red';
    }
  }

  cargarClase();

  // Validar inputs antes de enviar
  function validarFormulario() {
    if (!form['titulo'].value.trim() ||
        !form['descripcion'].value.trim() ||
        !form['video'].value.trim() ||
        !form['nivel'].value) {
      mostrarMensaje('Por favor completa todos los campos.', 'orange');
      return false;
    }
    return true;
  }

  function mostrarMensaje(texto, color = 'white') {
    if (mensaje) {
      mensaje.textContent = texto;
      mensaje.style.color = color;
    }
  }

  // Actualizar clase
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    const formData = new FormData(form);

    try {
      const res = await fetch(`${API_URL}/clases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarMensaje(data.error || 'No se pudo actualizar la clase.', 'red');
        return;
      }

      mostrarMensaje('Clase actualizada correctamente. Redirigiendo...', 'lightgreen');
      setTimeout(() => {
        window.location.href = './admin.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor.', 'red');
    }
  });
});
