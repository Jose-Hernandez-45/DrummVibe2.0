document.addEventListener('DOMContentLoaded', () => {
  const API_URL = location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://drummvibe2-0.onrender.com';

  // LOGIN
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = loginForm.usuario.value.trim();
      const contrasena = loginForm.contrasena.value.trim();

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, contrasena }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', data.usuario);
          localStorage.setItem('rol', data.rol);
          alert('Login exitoso');
          // Redirigir o actualizar UI aquí
          window.location.href = 'panel.html'; // ejemplo
        } else {
          alert(data.error || 'Error en login');
        }
      } catch (error) {
        console.error(error);
        alert('Error en el servidor');
      }
    });
  }

  // CARGAR USUARIOS
  const tabla = document.querySelector('#tablaUsuarios tbody');
  const buscador = document.getElementById('buscador');
  const mensaje = document.getElementById('mensajeCambios'); // div para mensajes
  let usuarios = [];

  async function cargarUsuarios() {
    const token = localStorage.getItem('token');
    if (!token) {
      mostrarMensaje('No autorizado. Por favor inicia sesión.', false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al obtener usuarios');
      }

      usuarios = await res.json();
      mostrarUsuarios(usuarios);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      mostrarMensaje(err.message, false);
    }
  }

  function mostrarUsuarios(lista) {
    if (!tabla) return;
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
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = 'Admin';

      tdRol.appendChild(checkbox);
      tdRol.appendChild(label);

      fila.appendChild(tdUsuario);
      fila.appendChild(tdCorreo);
      fila.appendChild(tdRol);

      fila.dataset.usuario = user.usuario;
      tabla.appendChild(fila);
    });
  }

  buscador?.addEventListener('input', () => {
    const texto = buscador.value.toLowerCase();
    const filtrados = usuarios.filter(u => u.usuario.toLowerCase().includes(texto));
    mostrarUsuarios(filtrados);
  });

  function mostrarMensaje(texto, exito = true) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = exito ? '#49cc21' : '#da0700';
  }

  // Guardar cambios en roles
  document.getElementById('guardarCambios')?.addEventListener('click', async () => {
    const filas = tabla.querySelectorAll('tr');
    const cambios = [];
    const token = localStorage.getItem('token');
    if (!token) {
      mostrarMensaje('No autorizado. Por favor inicia sesión.', false);
      return;
    }

    filas.forEach(fila => {
      const usuario = fila.dataset.usuario;
      const esAdmin = fila.querySelector('.admin-checkbox').checked;
      cambios.push({ usuario, rol: esAdmin ? 'administrador' : 'usuario' });
    });

    try {
      const res = await fetch(`${API_URL}/usuarios/actualizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cambios),
      });
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

  // Solo cargar usuarios si existe la tabla
  if (tabla) cargarUsuarios();

});
