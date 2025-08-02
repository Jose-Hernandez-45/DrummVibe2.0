document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formClase');
  const mensaje = document.getElementById('mensajeClase');
  const buscador = document.getElementById('buscar');
  const filtroNivel = document.getElementById('filtroNivel');
  const limpiarBtn = document.getElementById('limpiarFiltros');
  const tbody = document.getElementById('tbodyClases');

  const contenedoresPanel = {
    '1': document.getElementById('panel-basico'),
    '2': document.getElementById('panel-intermedio'),
    '3': document.getElementById('panel-avanzado'),
  };

  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  function escapeHTML(text) {
    return text
      ? text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
      : '';
  }

  function getToken() {
    return localStorage.getItem('token');
  }

  function mostrarMensaje(texto, color = 'white') {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
  }

  function extraerYoutubeId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // --- FORMULARIO para crear clase ---
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
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          body: formData
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarMensaje(data.error || 'Error al guardar la clase.', 'red');
          return;
        }

        mostrarMensaje('Clase guardada correctamente, puedes regresar', 'lightgreen');
        setTimeout(() => form.reset(), 5000);
        cargarClases();
        cargarClasesEnPanel();
      } catch (error) {
        console.error(error);
        mostrarMensaje('Error al conectar con el servidor.', 'red');
      }
    });
  }

  // --- CARGAR y mostrar clases en tabla con filtros ---
  async function cargarClases(filtroTexto = '', filtroNivel = '') {
    if (!tbody) return;

    try {
      const res = await fetch(`${API_URL}/clases`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Acceso no autorizado. Por favor inicia sesión.</td></tr>';
          return;
        }
        throw new Error('Error al obtener clases');
      }
      const clases = await res.json();

      tbody.innerHTML = '';

      const nivelesTexto = { '1': 'Básico', '2': 'Intermedio', '3': 'Avanzado' };

      const clasesFiltradas = clases.filter(clase => {
        const titulo = clase.titulo?.toLowerCase() || '';
        const coincideTexto = titulo.includes(filtroTexto.toLowerCase());
        const coincideNivel = filtroNivel ? String(clase.nivel) === filtroNivel : true;
        return coincideTexto && coincideNivel;
      });

      if (clasesFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#666;">No se encontraron clases</td></tr>';
        return;
      }

      clasesFiltradas.forEach(clase => {
        const textoNivel = nivelesTexto[String(clase.nivel)] || 'Sin especificar';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML(clase.titulo)}</td>
          <td>${escapeHTML(textoNivel)}</td>
          <td>
            <button class="btn btn-sm btn-warning btnEditar" data-id="${escapeHTML(clase._id)}">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger btnEliminar" data-id="${escapeHTML(clase._id)}">
              <i class="fa-solid fa-trash"></i> Borrar
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      agregarEventosBotones();
    } catch (error) {
      console.error('Error al cargar clases:', error);
      tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Error al cargar clases</td></tr>';
    }
  }

  // --- CARGAR clases en paneles (básico, intermedio, avanzado) ---
  async function cargarClasesEnPanel() {
    const algunoExiste = Object.values(contenedoresPanel).some(div => div != null);
    if (!algunoExiste) return;

    try {
      const res = await fetch(`${API_URL}/clases`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          Object.values(contenedoresPanel).forEach(div => {
            if (div) div.innerHTML = '<p style="color:red;">Acceso no autorizado. Por favor inicia sesión.</p>';
          });
          return;
        }
        throw new Error('Error al obtener clases');
      }
      const clases = await res.json();

      Object.values(contenedoresPanel).forEach(div => {
        if (div) div.innerHTML = '';
      });

      clases.forEach(clase => {
        const divClase = document.createElement('div');
        divClase.classList.add('clase-card', `nivel-${clase.nivel}`);

        const videoId = extraerYoutubeId(clase.video);

        divClase.innerHTML = `
          <h5 class="clase-titulo">${escapeHTML(clase.titulo)}</h5>
          <p class="clase-descripcion">${escapeHTML(clase.descripcion)}</p>
          ${
            videoId
              ? `<div class="video-container mb-2">
                  <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" allowfullscreen title="Video de clase">
                  </iframe>
                </div>`
              : `<p><a class="clase-video" href="${escapeHTML(clase.video)}" target="_blank" rel="noopener noreferrer">Ver video</a></p>`
          }
          <a href="/templates/clase.html?id=${encodeURIComponent(clase._id)}" class="btn btn-outline-primary mt-2">
            Ver clase completa <i class="fa-solid fa-arrow-right"></i>
          </a>
        `;

        const contenedor = contenedoresPanel[clase.nivel];
        if (contenedor) contenedor.appendChild(divClase);
      });
    } catch (error) {
      console.error('Error al cargar clases en panel:', error);
      Object.values(contenedoresPanel).forEach(div => {
        if (div) div.innerHTML = '<p style="color: red;">Error al cargar clases</p>';
      });
    }
  }

  // --- Añadir eventos a botones editar y eliminar ---
  function agregarEventosBotones() {
    // Botones eliminar
    const btnEliminar = document.querySelectorAll('.btnEliminar');
    btnEliminar.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (!confirm('¿Seguro que quieres eliminar esta clase?')) return;

        try {
          const res = await fetch(`${API_URL}/clases/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });

          if (res.ok) {
            alert('Clase eliminada');
            aplicarFiltros();
            cargarClasesEnPanel();
          } else {
            const errData = await res.json().catch(() => ({}));
            alert(errData.error || 'Error al eliminar clase');
            console.error('Error al eliminar clase:', errData);
          }
        } catch (error) {
          alert('Error al eliminar clase');
          console.error('Fetch DELETE error:', error);
        }
      });
    });

    // Botones editar
    const btnEditar = document.querySelectorAll('.btnEditar');
    btnEditar.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        window.location.href = `./editar_clase.html?id=${encodeURIComponent(id)}`;
      });
    });
  }

// --- Mostrar detalle de clase en clase.html ---
if (window.location.pathname.includes('clase.html')) {
  const titulo = document.getElementById("titulo-clase");
  const video = document.getElementById("video-clase");
  const descripcion = document.getElementById("descripcion-clase");
  const archivoContenedor = document.getElementById("archivo-clase");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    if (titulo) titulo.textContent = "Clase no encontrada";
    if (descripcion) descripcion.textContent = "ID de clase no especificado.";
    if (archivoContenedor) archivoContenedor.innerHTML = '';
    return;
  }

  fetch(`${API_URL}/clases/${id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Acceso no autorizado. Por favor inicia sesión.');
        }
        throw new Error('Clase no encontrada');
      }
      return res.json();
    })
    .then(clase => {
      // Mostrar título
      if (titulo) titulo.textContent = clase.titulo;

      // Mostrar video (YouTube embebido o link directo)
      if (video) {
        const videoId = extraerYoutubeId(clase.video);
        video.src = videoId ? `https://www.youtube.com/embed/${videoId}` : clase.video;
      }

      // Mostrar descripción
      if (descripcion) descripcion.textContent = clase.descripcion;

      // Mostrar archivo adjunto
      if (archivoContenedor) {
        if (clase.documento && clase.documento.trim() !== '') {
          const urlArchivo = `${API_URL}/uploads/${encodeURIComponent(clase.documento)}`;
          const extension = clase.documento.split('.').pop().toLowerCase();

          if (extension === 'pdf') {
            archivoContenedor.innerHTML = `
              <div style="width: 100%; height: 500px; border: 1px solid #ccc;">
                <iframe 
                  src="${urlArchivo}" 
                  width="100%" 
                  height="100%" 
                  style="border:none;" 
                  title="Documento PDF">
                </iframe>
              </div>
            `;
          } else {
            archivoContenedor.innerHTML = `
              <p>Archivo adjunto: 
                <a href="${urlArchivo}" download target="_blank" rel="noopener noreferrer">
                  Descargar archivo
                </a>
              </p>
            `;
          }
        } else {
          archivoContenedor.innerHTML = ''; // Limpia si no hay archivo
        }
      }
    })
    .catch(err => {
      console.error(err);
      if (titulo) titulo.textContent = "Clase no encontrada";
      if (descripcion) descripcion.textContent = err.message || "No se pudo cargar la información de la clase.";
      if (archivoContenedor) archivoContenedor.innerHTML = '';
    });
}


  // --- Aplicar filtros ---
  function aplicarFiltros() {
    const texto = buscador?.value || '';
    const nivel = filtroNivel?.value || '';
    cargarClases(texto, nivel);
  }

  // --- Listeners filtros y botón limpiar ---
  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroNivel) filtroNivel.addEventListener('change', aplicarFiltros);
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', () => {
      if (buscador) buscador.value = '';
      if (filtroNivel) filtroNivel.value = '';
      aplicarFiltros();
    });
  }

  // --- Inicializar carga ---
  if (tbody) cargarClases();
  if (Object.values(contenedoresPanel).some(div => div != null)) cargarClasesEnPanel();
});
