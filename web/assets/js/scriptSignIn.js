document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.getElementById("formulario");
    const inputEmail = document.getElementById("Email");
    const inputPassword = document.getElementById("Password");
    const responseMsg = document.getElementById("responseMsgSignUp");

    function mostrarError(mensaje) {
        responseMsg.textContent = mensaje;
        responseMsg.className = "alert-message alert-error";
        responseMsg.style.display = "block";
    }

    function Customer(id, firstName, lastName, middleInitial, street, city, state, zip, phone, email, password) {
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

    formulario.addEventListener("submit", async (event) => {
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

        try {
            // Fetch login y obtener customerId
            const loginRes = await fetch(formulario.action + `${encodeURIComponent(email)}/${encodeURIComponent(password)}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/xml'}
            });

            if (loginRes.status === 401) throw new Error("Credenciales incorrectas");
            if (loginRes.status === 500) throw new Error("Error en el servidor");
            if (!loginRes.ok) throw new Error("Error inesperado");

            const xmlData = await loginRes.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, "application/xml");
            const customerNode = xmlDoc.getElementsByTagName("customer")[0];
            const customerId = customerNode.querySelector(":scope > id").textContent.trim();

            sessionStorage.setItem("customer.id", customerId);
            console.log("CustomerId guardado:", customerId);

            // Guardar accountId
            await fetchAccountId(customerId);

            // Redirigir al main después de todo
            window.location.href = "main.html";

        } catch (error) {
            mostrarError(error.message);
        }
    });

}); 


async function fetchAccountId(customerId) {
    // ===== FETCH CUENTAS =====
    let accounts = [];
    try {
        const accountRes = await fetch(`/CRUDBankServerSide/webresources/account`, {
            method: 'GET',
            headers: { 'Accept': 'application/xml' }
        });

        if (!accountRes.ok) throw new Error(`Error obteniendo cuentas: ${accountRes.status}`);

        const accountXml = await accountRes.text();
        console.log("XML de cuentas recibido:\n", accountXml);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(accountXml, "application/xml");

        const allAccounts = Array.from(xmlDoc.getElementsByTagName("account"));

        // Filtrar solo las cuentas que pertenecen al customerId
        const userAccounts = allAccounts.filter(acc => {
            const customers = acc.getElementsByTagName("customers");
            for (const cust of customers) {
                const idNode = cust.getElementsByTagName("id")[0];
                if (idNode && idNode.textContent.trim() === customerId) {
                    return true;
                }
            }
            return false;
        });

        if (userAccounts.length === 0) {
            console.warn("No se encontraron cuentas para este usuario");
        }

        // Guardar IDs de las cuentas en sessionStorage
        const accountIds = userAccounts.map(acc => acc.getElementsByTagName("id")[0].textContent.trim());
        sessionStorage.setItem("customer.accountIds", JSON.stringify(accountIds));
        if (accountIds.length > 0) sessionStorage.setItem("customer.accountId", accountIds[0]);

        accounts = userAccounts;

    } catch (error) {
        console.error("Error al obtener cuentas:", error.message);
        throw error;
    }

    // ===== FETCH CUSTOMER =====
    let customerXml = null;
    try {
        const customerRes = await fetch(`/CRUDBankServerSide/webresources/customer/${customerId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/xml' }
        });

        if (!customerRes.ok) throw new Error(`Error obteniendo customer: ${customerRes.status}`);

        customerXml = await customerRes.text();
        console.log("XML de customer recibido:\n", customerXml);

    } catch (error) {
        console.error("Error al obtener customer:", error.message);
        throw error;
    }

    // ===== DEVOLVER AMBOS =====
    return {
        accountsXml: accounts,  // Array de nodos <account> filtrados
        customerXml             // Texto XML del customer
    };
}


