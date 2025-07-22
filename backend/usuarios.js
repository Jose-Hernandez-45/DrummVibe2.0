document.addEventListener('DOMContentLoaded', () => {
  const tabla = document.querySelector('#tablaUsuarios tbody');
  const buscador = document.getElementById('buscador');
  const mensaje = document.getElementById('mensajeCambios'); // Debe existir en el HTML
  let usuarios = [];

  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  // Obtener token de localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    alert('No estás autenticado. Por favor inicia sesión.');
    window.location.href = './login.html';
    return;
  }

  async function cargarUsuarios() {
    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        // Token inválido, expirado o no autorizado
        alert('Sesión expirada o no autorizada. Por favor inicia sesión de nuevo.');
        localStorage.clear();
        window.location.href = '/templates/login.html';
        return;
      }

      if (!res.ok) throw new Error('Error al obtener usuarios');

      usuarios = await res.json();
      mostrarUsuarios(usuarios);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      mostrarMensaje('No se pudieron cargar los usuarios.', false);
    }
  }

  function mostrarUsuarios(lista) {
    tabla.innerHTML = '';
    lista.forEach(user => {
      const fila = document.createElement('tr');

      const tdUsuario = document.createElement('td');
      tdUsuario.textContent = user.usuario;

      const tdCorreo = document.createElement('td');
      tdCorreo.textContent = user.correo;

      const tdRol = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'admin-checkbox';
      checkbox.checked = user.rol === 'administrador';
      checkbox.id = `chk-${user.usuario}`;

      // Etiqueta para checkbox (aunque no tiene texto visible)
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;

      tdRol.appendChild(checkbox);
      tdRol.appendChild(label);

      fila.appendChild(tdUsuario);
      fila.appendChild(tdCorreo);
      fila.appendChild(tdRol);

      fila.dataset.usuario = user.usuario;
      tabla.appendChild(fila);
    });
  }

  buscador.addEventListener('input', () => {
    const texto = buscador.value.toLowerCase();
    const filtrados = usuarios.filter(u => u.usuario.toLowerCase().includes(texto));
    mostrarUsuarios(filtrados);
  });

  function mostrarMensaje(texto, exito = true) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = exito ? '#49cc21' : '#da0700';
  }

  document.getElementById('guardarCambios').addEventListener('click', async () => {
    const filas = tabla.querySelectorAll('tr');
    const cambios = [];

    filas.forEach(fila => {
      const usuario = fila.dataset.usuario;
      const checkbox = fila.querySelector('.admin-checkbox');
      if (!checkbox) return; // Evitar error si no encuentra el checkbox

      const esAdmin = checkbox.checked;
      cambios.push({ usuario, rol: esAdmin ? 'administrador' : 'usuario' });
    });

    try {
      const res = await fetch(`${API_URL}/usuarios/actualizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cambios),
      });

      if (res.status === 401 || res.status === 403) {
        alert('Sesión expirada o no autorizada. Por favor inicia sesión de nuevo.');
        localStorage.clear();
        window.location.href = '/templates/login.html';
        return;
      }

      const data = await res.json();

      if (res.ok) {
        mostrarMensaje(data.message || 'Cambios guardados correctamente.');
      } else {
        mostrarMensaje(data.error || 'Error al guardar cambios.', false);
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al guardar los cambios.', false);
    }
  });

  cargarUsuarios();
});
