// Toma el botón
const btnDarkMode = document.getElementById("darkModeToggle");

// Cargar estado guardado
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    btnDarkMode.textContent = "☀️";
}

// Activar / desactivar modo oscuro
btnDarkMode.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const active = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", active);

    
});
