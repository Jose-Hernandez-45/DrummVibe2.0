// ajustes.js

const usuarioInput = document.getElementById("usuario");
const correoInput = document.getElementById("correo");
const telefonoInput = document.getElementById("telefono");
const nuevaContrasenaInput = document.getElementById("nuevaContrasena");
const confirmarContrasenaInput = document.getElementById("confirmarContrasena");
const formAjustes = document.getElementById("formAjustes");
const formEliminar = document.getElementById("formEliminar");

// Obtener token de localStorage
const token = localStorage.getItem("token");

// Si no hay token, redirige al login
if (!token) {
  window.location.href = "/login.html";
}

// Cargar datos del usuario autenticado
async function cargarDatosUsuario() {
  try {
    const res = await fetch("/api/usuario/datos", {  // CORREGIDO: ruta correcta
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("No se pudieron obtener los datos del usuario");
    }

    const data = await res.json();

    // Mostrar datos en los campos
    usuarioInput.value = data.usuario || "";
    correoInput.value = data.correo || "";
    telefonoInput.value = data.telefono || "";
  } catch (error) {
    console.error("Error al cargar los datos del usuario:", error);
    alert("Error al cargar los datos. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    window.location.href = "/templates/login.html";  // CORREGIDO: ruta consistente
  }
}

cargarDatosUsuario();

// Guardar cambios del usuario
formAjustes.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    usuario: usuarioInput.value,
    correo: correoInput.value,
    telefono: telefonoInput.value,
  };

  if (nuevaContrasenaInput.value.trim() !== "") {
    datos.nuevaContrasena = nuevaContrasenaInput.value;
  }

  try {
    const res = await fetch("/api/usuario/actualizar", {  // CORREGIDO: ruta PUT para actualizar
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo actualizar el usuario");
    }

    alert("Datos actualizados correctamente");
    nuevaContrasenaInput.value = "";
    confirmarContrasenaInput.value = "";
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error al actualizar los datos del usuario.");
  }
});

// Eliminar cuenta del usuario
formEliminar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const confirmacion = confirm("¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.");

  if (!confirmacion) return;

  try {
    const res = await fetch("/api/usuario/eliminar", {  // CORREGIDO: ruta DELETE correcta
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contrasena: confirmarContrasenaInput.value,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo eliminar la cuenta");
    }

    alert("Cuenta eliminada correctamente");
    localStorage.removeItem("token");
    window.location.href = "/templates/login.html";
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    alert("Error al eliminar cuenta. Verifica tu contraseña.");
  }
});
