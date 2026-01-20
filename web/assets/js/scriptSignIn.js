const inputEmail = document.getElementById("Email");
const inputPassword = document.getElementById("Password");
const responseMsg = document.getElementById("responseMsgSignUp");

const formulario = document.getElementById("formulario");

document.addEventListener('DOMContentLoaded', function() {
    // ===== MOBILE MENU =====
    const navToggler = document.getElementById('navToggler');
    const navMenu = document.getElementById('navMenu');

    if (navToggler && navMenu) {
        navToggler.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // ===== DARK MODE (ALTERNATE STYLESHEET) =====
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');
    const darkModeCSS = document.getElementById('dark-mode-css');

    // Cargar preferencia guardada
    if (localStorage.getItem('darkMode') === 'enabled') {
        darkModeCSS.disabled = false;
        darkModeIcon.className = 'fas fa-sun';
    } else {
        darkModeCSS.disabled = true;
        darkModeIcon.className = 'fas fa-moon';
    }

    // Toggle con el botón
    darkModeToggle.addEventListener('click', () => {
        if (darkModeCSS.disabled) {
            darkModeCSS.disabled = false;
            localStorage.setItem('darkMode', 'enabled');
            darkModeIcon.className = 'fas fa-sun';
        } else {
            darkModeCSS.disabled = true;
            localStorage.setItem('darkMode', 'disabled');
            darkModeIcon.className = 'fas fa-moon';
        }
    });

    // ===== SHOW/HIDE PASSWORD =====
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });

    // ===== LOGIN FORM VALIDATION =====
    function mostrarError(mensaje) {
        responseMsg.textContent = mensaje;
        responseMsg.className = "alert-message alert-error";
        responseMsg.style.display = "block";
    }

    formulario.addEventListener("submit", (event) => {
        event.preventDefault();
        responseMsg.style.display = "none";
        responseMsg.className = "";

        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email === "" || email.length > 255 || !emailRegExp.test(email)) {
            let mensaje = email === "" ? "Se debe rellenar el email..."
                        : email.length > 255 ? "El email no puede tener más de 255 caracteres..."
                        : "El email no tiene un formato válido...";
            mostrarError(mensaje);
            return;
        }

        if (password.length > 255 || password.length < 6) {
            let mensaje = password.length > 255 ? "La contraseña no puede tener más de 255 caracteres."
                        : "La contraseña debe tener al menos 6 caracteres.";
            mostrarError(mensaje);
            return;
        }

        sendRequestAndProcessResponse();
    });

    // ===== CUSTOMER CONSTRUCTOR =====
    function Customer(id, firstName, lastName, middleInitial, street, city, state, zip, phone, email, password){
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.middleInitial = middleInitial;
        this.street = street;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }

    // ===== FETCH LOGIN =====
    function sendRequestAndProcessResponse() {
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        fetch(formulario.action + `${encodeURIComponent(email)}/${encodeURIComponent(password)}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/xml'}
        }).then(res => {
            if (res.status === 401)
                return res.text().then(() => {throw new Error("Credenciales incorrectas");});
            if (res.status === 500)
                return res.text().then(() => {throw new Error("Error en el servidor");});
            if (!res.ok)
                return res.text().then(text => {throw new Error(text || "Error inesperado");});
            return res.text();
        }).then(data => {
            storeResponseXMLData(data);
            window.location.href = "main.html"; // Main
        }).catch(error => {
            mostrarError(error.message);
        });
    }

    // ===== PARSE XML Y GUARDAR EN SESSION =====
    function storeResponseXMLData(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        const customerNode = xmlDoc.getElementsByTagName("customer")[0];
        const customer = new Customer(
            customerNode.querySelector(":scope > id").textContent.trim(),
            customerNode.querySelector(":scope > firstName").textContent,
            customerNode.querySelector(":scope > lastName").textContent,
            customerNode.querySelector(":scope > middleInitial").textContent,
            customerNode.querySelector(":scope > street").textContent,
            customerNode.querySelector(":scope > city").textContent,
            customerNode.querySelector(":scope > state").textContent,
            customerNode.querySelector(":scope > zip").textContent,
            customerNode.querySelector(":scope > phone").textContent,
            customerNode.querySelector(":scope > email").textContent,
            customerNode.querySelector(":scope > password").textContent
        );

        // Guardar todo en sessionStorage
        for (const key in customer) {
            sessionStorage.setItem(`customer.${key}`, customer[key]);
        }
        console.log("UserId en sessionStorage:", sessionStorage.getItem("customer.id"));
    }
});
