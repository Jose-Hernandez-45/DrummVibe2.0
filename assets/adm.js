// Acceso restringido a usuarios normales
document.addEventListener('DOMContentLoaded', () => {
  const rol = localStorage.getItem('rol');
  if (rol !== 'administrador') {
    window.location.href = '/templates/accs_no.html';
  }
});

// funcion para cerrar sesión dentro de admin
document.addEventListener('DOMContentLoaded', () => {
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Eliminar datos de sesión del navegador
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');

    // Redirigir al index
    window.location.href = '/index.html';
    });
}
});
