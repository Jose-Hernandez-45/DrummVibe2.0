document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formClase');
  const mensaje = document.getElementById('mensajeClase');
  const buscador = document.getElementById('buscar');
  const filtroNivel = document.getElementById('filtroNivel');
  const limpiarBtn = document.getElementById('limpiarFiltros');
  const tbody = document.getElementById('tbodyClases');

  // Detectar la URL base según el entorno
  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  // GUARDAR CLASE
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titulo = form['titulo'].value.trim();
      const descripcion = form['descripcion'].value.trim();
      const video = form['video'].value.trim();
      const nivel = form['nivel'].value;

      if (!titulo || !descripcion || !video || !nivel) {
        mostrarMensaje('Por favor completa todos los campos requeridos.', 'orange');
        return;
      }

      const formData = new FormData(form);

      try {
        const res = await fetch(`${API_URL}/clases`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarMensaje(data.error || 'Error al guardar la clase.', 'red');
          return;
        }

        mostrarMensaje('Clase guardada correctamente, puedes regresar', 'lightgreen');
        setTimeout(() => {
          // Opcional: redirigir o limpiar formulario
        }, 5000);
      } catch (error) {
        console.error(error);
        mostrarMensaje('Error al conectar con el servidor.', 'red');
      }
    });
  }

  // MOSTRAR MENSAJE
  function mostrarMensaje(texto, color = 'white') {
    if (mensaje) {
      mensaje.textContent = texto;
      mensaje.style.color = color;
    }
  }

  // CARGAR CLASES CON FILTROS
  async function cargarClases(filtroTexto = '', filtroNivel = '') {
    if (!tbody) return;

    try {
      const res = await fetch(`${API_URL}/clases`);
      const clases = await res.json();

      tbody.innerHTML = '';

      const nivelesTexto = {
        '1': 'Básico',
        '2': 'Intermedio',
        '3': 'Avanzado',
      };

      const clasesFiltradas = clases.filter(clase => {
        const titulo = clase.titulo?.toLowerCase() || '';
        const coincideTexto = titulo.includes(filtroTexto.toLowerCase());
        const coincideNivel = filtroNivel ? String(clase.nivel) === filtroNivel : true;
        return coincideTexto && coincideNivel;
      });

      clasesFiltradas.forEach(clase => {
        const textoNivel = nivelesTexto[String(clase.nivel)] || 'Sin especificar';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${clase.titulo}</td>
          <td>${textoNivel}</td>
          <td>
            <button class="btn btn-sm btn-warning btnEditar" data-id="${clase._id}">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger btnEliminar" data-id="${clase._id}">
              <i class="fa-solid fa-trash"></i> Borrar
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      agregarEventosBotones();
    } catch (error) {
      console.error('Error al cargar clases:', error);
    }
  }

  // BOTONES: ELIMINAR Y EDITAR
  function agregarEventosBotones() {
    document.querySelectorAll('.btnEliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Seguro que quieres eliminar esta clase?')) {
          try {
            const res = await fetch(`${API_URL}/clases/${id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              alert('Clase eliminada');
              aplicarFiltros();
            } else {
              alert('Error al eliminar clase');
            }
          } catch (error) {
            alert('Error al eliminar clase');
            console.error(error);
          }
        }
      });
    });

    document.querySelectorAll('.btnEditar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.href = `./editar_clase.html?id=${id}`;
      });
    });
  }

  // APLICAR FILTROS
  function aplicarFiltros() {
    const texto = buscador?.value || '';
    const nivel = filtroNivel?.value || '';
    cargarClases(texto, nivel);
  }

  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroNivel) filtroNivel.addEventListener('change', aplicarFiltros);
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', () => {
      buscador.value = '';
      filtroNivel.value = '';
      aplicarFiltros();
    });
  }

  // INICIALIZAR
  if (tbody) {
    cargarClases();
  }
});
