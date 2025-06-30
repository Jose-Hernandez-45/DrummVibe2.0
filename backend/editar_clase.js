document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEditarClase');
  const mensaje = document.getElementById('mensajeEditar');

  // Detectar la URL base según entorno
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

  // Cargar datos de la clase
  async function cargarClase() {
    try {
      const res = await fetch(`${API_URL}/clases/${id}`);
      const clase = await res.json();

      if (!res.ok) {
        mensaje.textContent = clase.error || 'No se pudo cargar la clase.';
        mensaje.style.color = 'red';
        return;
      }

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

  // Actualizar clase
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch(`${API_URL}/clases/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        mensaje.textContent = data.error || 'No se pudo actualizar la clase.';
        mensaje.style.color = 'red';
        return;
      }

      mensaje.textContent = 'Clase actualizada correctamente. Redirigiendo...';
      mensaje.style.color = 'lightgreen';
      setTimeout(() => {
        window.location.href = './admin.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      mensaje.textContent = 'Error al conectar con el servidor.';
      mensaje.style.color = 'red';
    }
  });
});
