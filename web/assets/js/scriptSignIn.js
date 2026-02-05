    const inputEmail = document.getElementById("Email");
    const inputPassword = document.getElementById("Password");
    const responseMsg = document.getElementById("responseMsgSignUp");

    const verContrasenya = document.getElementById("verContrasenya");
    const formulario = document.getElementById("formulario");

    
    document.addEventListener("DOMContentLoaded", () => {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeCSS = document.getElementById('dark-mode-css');
        const darkModeIcon = darkModeToggle.querySelector('i');

        // Cargar preferencia
        if (localStorage.getItem('darkMode') === 'enabled') {
            darkModeCSS.disabled = false;
            document.body.classList.add('dark-mode');
            darkModeIcon.className = 'fas fa-sun';
        }

        darkModeToggle.addEventListener('click', () => {
            if (darkModeCSS.disabled) {
                darkModeCSS.disabled = false;
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
                darkModeIcon.className = 'fas fa-sun';
            } else {
                darkModeCSS.disabled = true;
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
                darkModeIcon.className = 'fas fa-moon';
            }
        });
    });

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

    function mostrarError(mensaje) {
        responseMsg.textContent = mensaje;
        responseMsg.classList.add("error");
        responseMsg.style.display = "block";
    }


    formulario.addEventListener("submit", (event) =>{
        event.preventDefault();
        responseMsg.style.display = "none";
        responseMsg.className = "";

        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        const emailRegExp = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");

        if(email === "" || email.length > 255 || !emailRegExp.exec(email)){
            let mensaje = "";

            if(email === "")
                mensaje = "Se deben rellenar el email...";
            else if(email.length > 255)
                mensaje = "El email no puede tener más de 255 caracteres...";
            else 
                mensaje = "El email no tiene un formato valido...";

            mostrarError(mensaje);
            return;
        }

        if(password.length > 255 || password.length < 6){
            let mensaje = "";
            if(password.length > 255)
                mensaje = "La contraseña no puede tener mas de 255 caracteres.";
            else
                mensaje = "La contraseña debe tener al menos 6 caracteres.";

            mostrarError(mensaje);
            return;
        }
        sendRequestAndProcessResponse();
    });

/*
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
  */                 
    function sendRequestAndProcessResponse (){
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        fetch(formulario.action + `${encodeURIComponent(email)}/${encodeURIComponent(password)}`, {
            method: 'GET', 
            headers: {'Content-Type': 'application/xml'}
        }).then(res => {
            if(res.status === 401)
                return res.text().then(text => {throw new Error("Credenciales Incorrectas");});
            else if(res.status === 500)
                return res.text().then(text => {throw new Error("Error en el Servidor");});
            else if (!res.ok)
                return res.text().then(text => {throw new Error(text || "Error Inesperado");});
            return res.text();
        }).then(data => {
            storeResponseXMLData(data);
            window.location.href = "main.html"; /* Main */
        }).catch(error => {
            //textoErrorP.innerHTML = 'Error: ' + error.message;
            mostrarError(error.message);
        }).catch(error => {
            mostrarError(error.message);
        });
}



async function fetchAccountId(customerId) {
    try {
        const response = await fetch(`/CRUDBankServerSide/webresources/account`, {
            method: 'GET',
            headers: {'Content-Type': 'application/xml'}
        });

        if (response.status === 401)
            throw new Error("Credenciales incorrectas");

        if (response.status === 500)
            throw new Error("Error en el servidor");

        if (!response.ok)
            throw new Error("Error inesperado");

        const data = await response.text();

        storeResponseXMLData(data);

        const email = sessionStorage.getItem("customer.email") || "";
        const domain = (email.split('@')[1] || '').toLowerCase();

        if (domain.startsWith('admin')) {
            window.location.href = "customers.html";
        } else {
            window.location.href = "main.html";
        }

    } catch (error) {
        mostrarError(error.message);
    }
}

    

    function storeResponseXMLData (xmlString){ //Parametro -> cadena de texto que contiene los datos en formato XML.
        //Crea un parser XML -> DOMParser es una clase del navegador que permite convertir texto XML o HTML en un documento DOM.
        const parser = new DOMParser();
        //Convierte la cadena XML en un objeto JavaScript tipo Document.
        const xmlDoc = parser.parseFromString(xmlString,"application/xml");

        //Extrae los datos del XML
        //getElementByTagName -> Busca elementos por el nombre de su etiqueta (tag HTML o XML).
        //const customerNode = xmlDoc.getElementsByTagName("customer")[0];
        //const id = customerNode.querySelector(":scope > id").textContent.trim();
        const id = xmlDoc.getElementsByTagName("id")[0].textContent;
        const firstName = xmlDoc.getElementsByTagName("firstName")[0].textContent;
        const lastName = xmlDoc.getElementsByTagName("lastName")[0].textContent;
        const middleInitial = xmlDoc.getElementsByTagName("middleInitial")[0].textContent;
        const street = xmlDoc.getElementsByTagName("street")[0].textContent;
        const city = xmlDoc.getElementsByTagName("city")[0].textContent;
        const state = xmlDoc.getElementsByTagName("state")[0].textContent;
        const zip = xmlDoc.getElementsByTagName("zip")[0].textContent;
        const phone = xmlDoc.getElementsByTagName("phone")[0].textContent;
        const email = xmlDoc.getElementsByTagName("email")[0].textContent;
        const password = xmlDoc.getElementsByTagName("password")[0].textContent;

        //Crea un objeto Customer -> Usa los valores extraídos del XML para crear una instancia de la clase Customer.
        const customer = new Customer(
            id, firstName, lastName, middleInitial, street, 
            city, state, zip, phone, email, password
        );

        //Guarda los datos en sessionStorage -> Guarda cada dato en el almacenamiento de sesión del navegador.
        sessionStorage.setItem("customer.id", customer.id);
        sessionStorage.setItem("customer.firstName", customer.firstName);
        sessionStorage.setItem("customer.lastName", customer.lastName);
        sessionStorage.setItem("customer.middleInitial", customer.middleInitial);
        sessionStorage.setItem("customer.street", customer.street);
        sessionStorage.setItem("customer.city", customer.city);
        sessionStorage.setItem("customer.state", customer.state);
        sessionStorage.setItem("customer.zip", customer.zip);
        sessionStorage.setItem("customer.phone", customer.phone);
        sessionStorage.setItem("customer.email", customer.email);
        sessionStorage.setItem("customer.password", customer.password);
        console.log("UserId en sessionStorage:", sessionStorage.getItem("customer.id"));

    }

