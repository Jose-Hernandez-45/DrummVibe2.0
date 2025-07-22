document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');
    const body = document.body;

    if(menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            // Alternar clases
            menu.classList.toggle('show');
            body.classList.toggle('menu-open');
            
            // Cambiar ícono
            menuToggle.innerHTML = menu.classList.contains('show') ? '&times;' : '&#9776;';
        });

        // Cerrar menú al hacer clic en enlaces
        const menuLinks = menu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if(window.innerWidth <= 768) { // Solo en móviles
                    menu.classList.remove('show');
                    body.classList.remove('menu-open');
                    menuToggle.innerHTML = '&#9776;';
                }
            });
        });
    }
});


// Mostrar animación de salida del loader al cargar la página
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    loader.style.pointerEvents = "none";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
    console.log("Este codigo es de Hernández Galindo José Miguel");
  }
});
