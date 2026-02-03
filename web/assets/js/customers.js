// customers.js
// ----------------


document.addEventListener('DOMContentLoaded', () => {
    // URL del servicio REST (lo llamo desde el cliente hacia el servidor Java)
    const apiUrl = '/CRUDBankServerSide/webresources/customer';

    // Referencias a elementos del DOM que voy a reusar
    const createBtn = document.getElementById('createCustomerBtn');
    const cancelBtn = document.getElementById('cancelCustomerBtn');
    const formContainer = document.getElementById('formContainer');
    const customerForm = document.getElementById('customerForm');
    const tbody = document.querySelector('#customerTable tbody');

    // Cache local simple: guardo la última lista recibida para rellenar formularios
    // al editar sin pedir otra vez al servidor.
    let lastCustomers = [];

    // Muestra un mensaje breve en la parte inferior del formulario.
    // Uso este helper para notificaciones simples (éxito / error).
    function showMsg(type, text) {
        const box = document.getElementById('customersMsg');
        if (!box) return; // si no existe el contenedor, no hago nada
        box.className = 'alert-message ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = text;
        box.style.display = 'block';
        // lo oculto automáticamente a los 3,5 segs
        setTimeout(() => box.style.display = 'none', 3500);
    }

    // Muestro un mensaje de error pequeño junto al campo
    function showError(msgBox, message) {
        if (!msgBox) return;
        msgBox.textContent = message;
        msgBox.style.color = "#ff0000";
        msgBox.style.marginTop = "5px";
        msgBox.style.display = "block";
    }

    // Valido el nombre: obligatorio, solo letras, longitud razonable
    function validateFirstName(idInput = "firstName", idMsg = "responseMsgName") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El nombre es obligatorio"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Máximo 255 caracteres"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "El nombre solo puede contener letras"); return false; }
        return true;
    }

    // Valido la inicial del segundo nombre: debe ser una sola letra
    function validateMiddleInitial(idInput = "middleInitial", idMsg = "responseMsgInitial") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const singleLetterRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ]$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return true; // si el campo no existe, lo considero válido
        if (input.value.trim() === "") { showError(msgBox, "La inicial del segundo nombre es obligatoria"); return false; }
        if (input.value.trim() !== "" && !singleLetterRegExp.test(input.value.trim())) { showError(msgBox, "Debe ser una sola letra"); return false; }
        return true;
    }

    // Valido apellido
    function validateLastName(idInput = "lastName", idMsg = "responseMsgLastName") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El apellido es obligatorio"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Máximo 255 caracteres"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "El apellido solo puede contener letras"); return false; }
        return true;
    }

    // Valido la calle
    function validateStreet(idInput = "street", idMsg = "responseMsgStreet") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const streetRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ0-9\s.,\/ -]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "La calle es obligatoria"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Máximo 255 caracteres"); return false; }
        if (!streetRegExp.test(input.value.trim())) { showError(msgBox, "La calle puede contener letras y números"); return false; }
        return true;
    }

    // Valido ciudad
    function validateCity(idInput = "city", idMsg = "responseMsgCity") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "La ciudad es obligatoria"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Máximo 255 caracteres"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "La ciudad solo puede contener letras"); return false; }
        return true;
    }

    // Valido el estado/provincia
    function validateState(idInput = "state", idMsg = "responseMsgState") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El estado es obligatorio"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Máximo 255 caracteres"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "El estado solo puede contener letras"); return false; }
        return true;
    }

    // Valido código postal (solo números)
    function validateZip(idInput = "zip", idMsg = "responseMsgZip") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const numbersOnlyRegExp = /^[0-9]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El código postal es obligatorio"); return false; }
        if (!numbersOnlyRegExp.test(input.value.trim())) { showError(msgBox, "Solo números"); return false; }
        return true;
    }

    // Valido teléfono (mínimo 9 dígitos y caracteres válidos)
    function validatePhone(idInput = "phone", idMsg = "responseMsgPhone") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const phoneRegExp = /^[+]{0,1}[0-9]+$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El teléfono es obligatorio"); return false; }
        if (input.value.trim().length < 9) { showError(msgBox, "Debe tener al menos 9 dígitos"); return false; }
        if (!phoneRegExp.test(input.value.trim())) { showError(msgBox, "Formato inválido"); return false; }
        return true;
    }

    // Valido correo electrónico
    function validateEmail(idInput = "email", idMsg = "responseMsgEmail") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
        if (input.value.trim() === "") { showError(msgBox, "El correo es obligatorio"); return false; }
        if (!emailRegExp.test(input.value.trim())) { showError(msgBox, "Formato de correo inválido"); return false; }
        return true;
    }

    // Valido el formulario completo antes de enviar
    function validateCreateUserForm() {
        return (
            validateFirstName() &&
            validateMiddleInitial() &&
            validateLastName() &&
            validateStreet() &&
            validateCity() &&
            validateState() &&
            validateZip() &&
            validatePhone() &&
            validateEmail()
        );
    }

    // Generador simple de contraseña: combino partes del nombre y teléfono
    // y añado caracteres aleatorios para obtener 9 caracteres.
    // Generador de contraseña de 9 caracteres
    // Requisitos: 9 caracteres, al menos una mayúscula, una minúscula, un dígito y un símbolo.
    function generarPassword(firstName, phone) {
        // Conjuntos de caracteres que voy a usar
        const mayus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const minus = "abcdefghijklmnopqrstuvwxyz";
        const digitos = "0123456789";
        const simbolos = "!@#$%&*?";

        // Longitud objetivo
        const length = 9;

        // Añado al principio al menos un carácter de cada tipo para asegurar variedad
        let pwd = '';
        pwd += mayus[Math.floor(Math.random() * mayus.length)];
        pwd += minus[Math.floor(Math.random() * minus.length)];
        pwd += digitos[Math.floor(Math.random() * digitos.length)];
        pwd += simbolos[Math.floor(Math.random() * simbolos.length)];

        // Resto de caracteres los elijo al azar entre todos los conjuntos
        const all = mayus + minus + digitos + simbolos;
        for (let i = pwd.length; i < length; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }

        // Mezclo los caracteres para que no queden siempre en el mismo orden
        pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');

        // Devuelvo la contraseña de longitud fija
        return pwd;
    }

    // Mostrar/ocultar formulario (inline abajo). Cuando abro para editar, relleno
    // los inputs con los valores del customer. Cuando abro para crear, reseteo el formulario.
    function showForm(edit = false, customer = null) {
        document.getElementById('formTitle').textContent = edit ? 'Editar Customer' : 'Crear Customer';
        if (customerForm) customerForm.reset();
        if (edit && customer) {
            document.getElementById('id').value = customer.id || '';
            document.getElementById('firstName').value = customer.firstName || '';
            document.getElementById('lastName').value = customer.lastName || '';
            document.getElementById('middleInitial').value = customer.middleInitial || '';
            document.getElementById('street').value = customer.street || '';
            document.getElementById('city').value = customer.city || '';
            document.getElementById('state').value = customer.state || '';
            document.getElementById('zip').value = customer.zip || '';
            document.getElementById('phone').value = customer.phone || '';
            document.getElementById('email').value = customer.email || '';
        }
        if (formContainer) {
            formContainer.classList.remove('hidden');
            formContainer.setAttribute('aria-hidden', 'false');
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
        const f = document.getElementById('firstName'); if (f) f.focus();
    }

    // Oculto el formulario y limpìo valores
    function hideForm() {
        if (formContainer) {
            formContainer.classList.add('hidden');
            formContainer.setAttribute('aria-hidden', 'true');
        }
        if (customerForm) customerForm.reset();
        if (createBtn) createBtn.focus();
    }

    // Pinto la tabla de customers que me devuelve el servidor
    function renderTable(list) {
        tbody.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            showMsg('error', 'No hay customers para mostrar.');
            return;
        }

        // guardo localmente la lista para usarla al editar (evito otra llamada)
        lastCustomers = list;

        for (const c of list) {
            const tr = document.createElement('tr');
            const columns = ['id','firstName','lastName','middleInitial','street','city','state','zip','phone','email'];
            for (const col of columns) {
                const td = document.createElement('td');
                td.textContent = c[col] != null ? String(c[col]) : '';
                td.title = td.textContent;
                tr.appendChild(td);
            }
            const actions = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.type = 'button'; editBtn.className = 'submit-btn'; editBtn.textContent = 'Editar';
            // al pulsar editar llamo a la función global que abre el formulario
            editBtn.addEventListener('click', () => { customersEdit(c.id); });
            const delBtn = document.createElement('button');
            delBtn.type = 'button'; delBtn.className = 'submit-btn'; delBtn.textContent = 'Borrar';
            delBtn.addEventListener('click', () => { customersDelete(c.id); });
            actions.appendChild(editBtn);
            actions.appendChild(document.createTextNode(' '));
            actions.appendChild(delBtn);
            tr.appendChild(actions);
            tbody.appendChild(tr);
        }
    }

    // Recupero todos los customers del servicio REST (GET)
    async function fetchCustomers() {
        try {
            const res = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) {
                const t = await res.text(); throw new Error('Status ' + res.status + ': ' + (t || res.statusText));
            }
            const data = await res.json();
            renderTable(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showMsg('error', 'No se pudieron cargar los customers: ' + err.message);
        }
    }

    // Crear o editar un customer (misma función para ambos casos)
    async function saveCustomer(evt) {
        evt.preventDefault();
        // Valido antes de enviar
        if (!validateCreateUserForm()) {
            showMsg('error', 'Formulario no válido. Revisa los campos.');
            return;
        }
        try {
            const idValRaw = (document.getElementById('id').value || '').toString().trim();
            const idNum = idValRaw !== '' && !isNaN(Number(idValRaw)) ? Number(idValRaw) : null;
            const custId = idNum !== null ? idNum : null;

            // Construyo el objeto customer usando la clase definida en clases.js
            // Hago conversiones simples a number para zip/phone porque el servidor
            // espera números para esos campos.
            const customer = new Customer(
                custId,
                document.getElementById('firstName').value || null,
                document.getElementById('lastName').value || null,
                document.getElementById('middleInitial').value || null,
                document.getElementById('street').value || null,
                document.getElementById('city').value || null,
                document.getElementById('state').value || null,
                (document.getElementById('zip').value ? Number(document.getElementById('zip').value) : null),
                (document.getElementById('phone').value ? Number(document.getElementById('phone').value) : null),
                document.getElementById('email').value || null,
                null // password la asigno a continuación
            );

            // Si estoy editando, intento conservar la contraseña existente;
            // si no existe, genero una nueva. En creación siempre genero.
            if (customer.id != null) {
                const existing = lastCustomers.find(x => Number(x.id) === Number(customer.id));
                customer.password = existing && existing.password ? existing.password : generarPassword(customer.firstName, String(customer.phone || ''));
            } else {
                customer.password = generarPassword(customer.firstName, String(customer.phone || ''));
            }

            // No envío la propiedad id cuando es creación
            if (customer.id === null || customer.id === undefined) delete customer.id;

            if (customer.id !== undefined) {
                // edición -> PUT
                const res = await fetch(apiUrl, { 
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(customer) });
                if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error al editar'); }
                showMsg('success','Customer editado correctamente.');
            } else {
                // creación -> POST
                const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(customer) });
                if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error al crear'); }
                showMsg('success','Customer creado correctamente.');
            }
            hideForm();
            await fetchCustomers();
        } catch (err) {
            console.error(err);
            showMsg('error','Fallo al guardar: ' + (err.message || err));
        }
    }

    // Borrar un customer por id (DELETE)
    async function customersDelete(id) {
        if (!confirm('¿Borrar este customer?'))
             return;
        try {
            const res = await fetch(apiUrl + '/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' });
            if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error al borrar'); }
            showMsg('success','Customer borrado');
            await fetchCustomers();
        } catch (err) {
            console.error(err);
            showMsg('error','No se pudo borrar: ' + err.message);
        }
    }

    // Exposición de funciones globales para compatibilidad con botones creados dinámicamente
    // y para que sea fácil probar desde la consola.
    window.customersEdit = function(id) {
        const found = lastCustomers.find(x => String(x.id) === String(id));
        if (!found) { showMsg('error','Customer no encontrado'); return; }
        showForm(true, found);
    };
    window.customersDelete = customersDelete;

    // Enlazo eventos del formulario y botones principales
    if (customerForm) customerForm.addEventListener('submit', saveCustomer);
    if (createBtn) createBtn.addEventListener('click', () => {
        // Cuando pulso crear, siempre preparo el formulario limpio
        if (formContainer && formContainer.classList.contains('hidden')) {
            if (customerForm) customerForm.reset();
            const idInput = document.getElementById('id'); if (idInput) idInput.value = '';
            document.getElementById('formTitle').textContent = 'Crear Customer';
            showForm(false);
        } else {
            hideForm();
        }
    });
    if (cancelBtn) cancelBtn.addEventListener('click', hideForm);

    // Si el usuario hace click fuera del contenido del modal (sobre el backdrop), cierro el modal
    if (formContainer) {
        formContainer.addEventListener('click', (e) => {
            if (e.target === formContainer) hideForm();
        });
    }
//funciona el commit
    // Inicio: cargo la lista de customers
    fetchCustomers();
});

