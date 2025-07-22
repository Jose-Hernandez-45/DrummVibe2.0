document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menu');
  if (!menu) return;

  menu.style.textAlign = 'center';

  const usuario = localStorage.getItem('usuario');
  const rol = localStorage.getItem('rol');

  if (usuario) {
    const bienvenidaLink = document.createElement('a');
    bienvenidaLink.textContent = `Bienvenid@ ${usuario}`;
    bienvenidaLink.href = '#';
    bienvenidaLink.style.fontFamily = '"Jura", sans-serif';
    bienvenidaLink.style.color = '#fff';
    bienvenidaLink.style.pointerEvents = 'none';
    bienvenidaLink.style.margin = '-0.5rem 0';
    bienvenidaLink.style.fontSize = '1.7rem';
    bienvenidaLink.style.display = 'block';

    const panelLink = document.createElement('a');
    panelLink.href = '/templates/panel.html';
    panelLink.textContent = 'Panel';
    panelLink.style.cursor = 'pointer';
    panelLink.style.display = 'block';

    const ajustesLink = document.createElement('a');
    ajustesLink.href = '/templates/ajustes.html'; // URL real de tu ajustes.html
    ajustesLink.textContent = 'Ajustes';
    ajustesLink.style.cursor = 'pointer';
    ajustesLink.style.display = 'block';

    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Cerrar sesión';
    logoutLink.style.cursor = 'pointer';
    logoutLink.style.display = 'block';

    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.reload();
    });

    const ejerciciosLink = menu.querySelector('a[href="#ejercicios"]');

    if (ejerciciosLink) {
      menu.insertBefore(bienvenidaLink, ejerciciosLink);
      menu.insertBefore(panelLink, bienvenidaLink.nextSibling);

      if (rol && rol.toLowerCase() === 'administrador') {
        const panelAdminLink = document.createElement('a');
        panelAdminLink.href = '../templates/adm/admin.html';
        panelAdminLink.textContent = 'Panel Admin';
        panelAdminLink.style.cursor = 'pointer';
        panelAdminLink.style.display = 'block';

        menu.insertBefore(panelAdminLink, panelLink.nextSibling);
      }

      // Insertar Ajustes y Cerrar sesión después del resto
      menu.appendChild(ajustesLink);
      menu.appendChild(logoutLink);
    }

    const loginLink = menu.querySelector('a[href="./templates/login.html"]');
    if (loginLink) loginLink.remove();
  }
});
