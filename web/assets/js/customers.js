// customers.js
// ----------------
// Implementé la lógica de cliente para listar, crear, editar y borrar
// customers usando el servicio REST del servidor Java. 


document.addEventListener('DOMContentLoaded', () => {
    // URL del servicio REST (lo llamo desde el cliente hacia el servidor Java)
    // La defino aquí para usarla en todas las llamadas fetch.
    const apiUrl = '/CRUDBankServerSide/webresources/customer';

    // Referencias DOM que voy a reutilizar
    // Obtengo las referencias de los elementos una sola vez para
    // evitar buscarlas repetidamente cuando el usuario interactúa.
    const createBtn = document.getElementById('createCustomerBtn');
    const cancelBtn = document.getElementById('cancelCustomerBtn');
    const formContainer = document.getElementById('formContainer');
    const customerForm = document.getElementById('customerForm');
    const tbody = document.querySelector('#customerTable tbody');
    // Referencias para el modal de confirmación de borrado
    const confirmContainer = document.getElementById('confirmContainer');
    const confirmMessageEl = document.getElementById('confirmMessage');
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');
    // Elementos para el vídeo de ayuda (Help)
    const helpBtn = document.getElementById('helpBtn');
    const helpVideoModal = document.getElementById('helpVideoModal');
    const helpH5pContainer = document.getElementById('h5p-container');
    const helpCloseBtn = document.getElementById('helpCloseBtn');

    // Caché local sencillo: guardo la última lista recibida para rellenar
    // el formulario al editar sin volver a llamar al servidor.
    // Uso esto para mantener la UI rápida y evitar solicitudes innecesarias.
    let lastCustomers = [];

    // Muestro un mensaje corto en la página.
    // Uso este helper para notificaciones simples (success / error).
    function showMsg(type, text) {
    const box = document.getElementById('customersMsg');
    if (!box) return; // si el contenedor no existe, no hago nada
        box.className = 'alert-message ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = text;
        box.style.display = 'block';
    // lo oculto automáticamente a los 3,5 segs
        setTimeout(() => box.style.display = 'none', 3500);
    }

    // Muestro un pequeño mensaje de error junto a un campo
    // Lo uso desde las funciones de validación para indicar problemas.
    function showError(msgBox, message) {
        if (!msgBox) return;
        msgBox.textContent = message;
        msgBox.style.color = "#ff0000";
        msgBox.style.marginTop = "5px";
        msgBox.style.display = "block";
    }

    // Muestro un mensaje dentro del formulario/modal y devuelvo una Promise
    // que se resuelve cuando el mensaje ha sido visible el tiempo indicado.
    // Lo utilizo para enseñar un mensaje de éxito dentro del modal
    // y luego cerrarlo automáticamente.
    function showFormMessage(type, text, duration = 2000) {
        return new Promise((resolve) => {
            const box = document.getElementById('formMsg');
            if (!box) { resolve(); return; }
            box.className = 'alert-message ' + (type === 'success' ? 'alert-success' : 'alert-error');
            box.textContent = text;
            box.style.display = 'block';
            // Mantengo el mensaje visible durante `duration` ms y luego cierro el modal
            setTimeout(() => {
                box.style.display = 'none';
                hideForm();
                resolve();
            }, duration);
        });
    }

    // Registro validaciones on-blur para los campos.
    // Copié el patrón de signUp porque ya funciona bien y es claro.
    function addBlurValidation(id, regex, errorMessage) {
        const field = document.getElementById(id);
        const errorEl = document.getElementById(id + 'Error');
        if (!field || !errorEl) return;

        field.addEventListener('blur', function() {
            const value = field.value.trim();
            if (value === '') {
                // ISI el campo esta vacio da error
                const span = errorEl.querySelector('span');
                if (span) span.textContent = 'This field is required';
                errorEl.style.display = 'flex';
                field.classList.add('error');
                return;
            }
            if (!regex.test(value)) {
                // pongo el mensaje y muestro la caja de error (yo lo muestro así)
                const span = errorEl.querySelector('span');
                if (span) span.textContent = errorMessage;
                errorEl.style.display = 'flex';
                field.classList.add('error');
            } else {
                errorEl.style.display = 'none';
                field.classList.remove('error');
            }
        });

        field.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                field.classList.remove('error');
                errorEl.style.display = 'none';
            }
        });
    }

    // Registro aquí las validaciones que se ejecutan al perder el foco.
    // Si un campo no existe en la página, lo omito silenciosamente.
    try {
        addBlurValidation('firstName', /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, 'First name must contain only letters and spaces (2–50 characters)');
        addBlurValidation('middleInitial', /^[A-Za-zÁÉÍÓÚáéíóúñÑ]?$/, 'Middle initial can only be one letter');
        addBlurValidation('lastName', /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, 'Last name must contain only letters and spaces (2–50 characters)');
        addBlurValidation('street', /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.,-]{2,90}$/, 'Street can contain letters, numbers, and spaces (2–90 characters)');
        addBlurValidation('city', /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, 'City must contain only letters and spaces (2–50 characters)');
        addBlurValidation('state', /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, 'State must contain only letters and spaces (2–50 characters)');
        addBlurValidation('zip', /^[0-9]{4,10}$/, 'ZIP Code must contain between 4 and 10 digits');
        addBlurValidation('phone', /^[+]{0,1}[0-9]{9,15}$/, 'Phone number must contain between 9 and 15 digits (optionally starting with +)');
        addBlurValidation('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email (example@domain.com)');
    } catch (e) {
        // Si algo falla al registrar, no quiero romper la página; lo aviso en la consola.
        console.warn('No se pudieron registrar todas las validaciones on-blur:', e);
    }

    // Valido el nombre: obligatorio, solo letras, longitud razonable
    function validateFirstName(idInput = "firstName", idMsg = "responseMsgName") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Compruebo que no esté vacío y que cumpla el patrón.
    if (input.value.trim() === "") { showError(msgBox, "First name is required"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Maximum 255 characters"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "First name can only contain letters"); return false; }
        return true;
    }

    // Valido la inicial del segundo nombre: debe ser una sola letra
    function validateMiddleInitial(idInput = "middleInitial", idMsg = "responseMsgInitial") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const singleLetterRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ]$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return true; // si el campo no existe, lo considero válido
    // Permito que esté vacío, pero si tiene valor debe ser una letra.
    if (input.value.trim() === "") { showError(msgBox, "Middle initial is required"); return false; }
        if (input.value.trim() !== "" && !singleLetterRegExp.test(input.value.trim())) { showError(msgBox, "Must be a single letter"); return false; }
        return true;
    }

    // Valido el apellido
    function validateLastName(idInput = "lastName", idMsg = "responseMsgLastName") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Me aseguro de que tenga contenido y que solo contenga letras.
    if (input.value.trim() === "") { showError(msgBox, "Last name is required"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Maximum 255 characters"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "Last name can only contain letters"); return false; }
        return true;
    }

    // Valido la calle
    function validateStreet(idInput = "street", idMsg = "responseMsgStreet") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const streetRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ0-9\s.,\/ -]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Permito números y símbolos  en la calle.
    if (input.value.trim() === "") { showError(msgBox, "Street is required"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Maximum 255 characters"); return false; }
        if (!streetRegExp.test(input.value.trim())) { showError(msgBox, "Street can contain letters and numbers"); return false; }
        return true;
    }

    // Valido la ciudad
    function validateCity(idInput = "city", idMsg = "responseMsgCity") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Compruebo que la ciudad sea texto y tenga longitud razonable.
    if (input.value.trim() === "") { showError(msgBox, "City is required"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Maximum 255 characters"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "City can only contain letters"); return false; }
        return true;
    }

    // Valido el estado/provincia
    function validateState(idInput = "state", idMsg = "responseMsgState") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const onlyLettersRegExp = /^[a-zA-ZÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Compruebo la presencia y el patrón del estado.
    if (input.value.trim() === "") { showError(msgBox, "State is required"); return false; }
        if (input.value.length > 255) { showError(msgBox, "Maximum 255 characters"); return false; }
        if (!onlyLettersRegExp.test(input.value.trim())) { showError(msgBox, "State can only contain letters"); return false; }
        return true;
    }

    // Valido el código postal (solo números)
    function validateZip(idInput = "zip", idMsg = "responseMsgZip") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const numbersOnlyRegExp = /^[0-9]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Me aseguro de que contenga solo dígitos.
    if (input.value.trim() === "") { showError(msgBox, "Zip code is required"); return false; }
        if (!numbersOnlyRegExp.test(input.value.trim())) { showError(msgBox, "Only numbers"); return false; }
        return true;
    }

    // Valido el teléfono (mínimo 9 dígitos)
    function validatePhone(idInput = "phone", idMsg = "responseMsgPhone") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const phoneRegExp = /^[+]{0,1}[0-9]+$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Permito el prefijo + y compruebo longitud mínima.
    if (input.value.trim() === "") { showError(msgBox, "Phone is required"); return false; }
        if (input.value.trim().length < 9) { showError(msgBox, "Must have at least 9 digits"); return false; }
        if (!phoneRegExp.test(input.value.trim())) { showError(msgBox, "Invalid format"); return false; }
        return true;
    }

    // Valido el correo electrónico
    function validateEmail(idInput = "email", idMsg = "responseMsgEmail") {
        const input = document.getElementById(idInput);
        const msgBox = document.getElementById(idMsg);
        const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (msgBox) msgBox.style.display = "none";
        if (!input) return false;
    // Valido el formato básico del email con una expresión regular.
    if (input.value.trim() === "") { showError(msgBox, "Email is required"); return false; }
        if (!emailRegExp.test(input.value.trim())) { showError(msgBox, "Invalid email format"); return false; }
        return true;
    }

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

    // Verifico todo el formulario llamando a cada validador.
    // Devuelvo true solo si todos los campos son válidos.
    // Esto evita enviar al servidor datos incompletos o inválidos.

    // Generador de contraseña de 9 caracteres.
    // Me aseguro de incluir al menos una mayúscula, una minúscula, un número y un símbolo.
    // Mantengo el generador sencillo y sin dependencias externas.
    function generarPassword(firstName, phone) {
        // Conjuntos de caracteres que voy a usar
        const mayus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const minus = "abcdefghijklmnopqrstuvwxyz";
        const digitos = "0123456789";
        const simbolos = "!@#$%&*?";

        // Longitud de la contraseña 9
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

    // Muestro/oculto el formulario (modal).
    // Relleno los campos si es una edición; si es creación, reseteo el formulario.
    function showForm(edit = false, customer = null) {
        document.getElementById('formTitle').textContent = edit ? 'Edit Customer' : 'Create Customer';
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

    // Oculto el formulario y limpio valores.
    // Devuelvo el foco al botón de crear para una UX cómoda.
    function hideForm() {
        if (formContainer) {
            formContainer.classList.add('hidden');
            formContainer.setAttribute('aria-hidden', 'true');
        }
        if (customerForm) customerForm.reset();
        if (createBtn) createBtn.focus();
    }

    // Pinto la tabla de customers que devuelve el servidor.
    // Construyo las filas dinámicamente y enlazo los botones Edit/Delete.
    function renderTable(list) {
        tbody.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            showMsg('error', 'No customers to display.');
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
            editBtn.type = 'button'; editBtn.className = 'submit-btn'; editBtn.textContent = 'Edit';
            editBtn.setAttribute('aria-label', `Edit customer ${c.firstName} ${c.lastName}`);
            // al pulsar editar llamo a la función global que abre el formulario
            editBtn.addEventListener('click', () => { customersEdit(c.id); });
            const delBtn = document.createElement('button');
            delBtn.type = 'button'; delBtn.className = 'submit-btn'; delBtn.textContent = 'Delete';
            delBtn.setAttribute('aria-label', `Delete customer ${c.firstName} ${c.lastName}`);
            delBtn.addEventListener('click', () => { customersDelete(c.id); });
            actions.appendChild(editBtn);
            actions.appendChild(document.createTextNode(' '));
            actions.appendChild(delBtn);
            tr.appendChild(actions);
            tbody.appendChild(tr);
        }
    }

    // Recupero todos los customers del servicio REST (GET)
    // Manejo errores mostrando un mensaje en la UI si algo falla.
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
            showMsg('error', 'Could not load customers: ' + err.message);
        }
    }

    // Crear o editar un customer (misma función para ambos casos)
    // Valido el formulario, construyo la instancia Customer y llamo al API.
    async function saveCustomer(evt) {
        evt.preventDefault();
        // Valido antes de enviar
        if (!validateCreateUserForm()) {
            showMsg('error', 'Form invalid. Check fields.');
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

            // Compruebo duplicado de email en el cliente antes de enviar.
            // Si ya existe otro usuario con el mismo email , evito la petición
            // y muestro el error para que el cliente vea que no s.
            const emailEl = document.getElementById('email');
            const emailErrBox = document.getElementById('emailError');
            if (customer.email) {
                const eLower = String(customer.email).toLowerCase();
                const duplicate = lastCustomers.some(u => u.email && String(u.email).toLowerCase() === eLower && (customer.id === undefined || String(u.id) !== String(customer.id)));
                if (duplicate) {
                    showError(emailErrBox, 'This email is already in use');
                    if (emailEl) emailEl.focus();
                    return;
                }
            }

            // No envío la propiedad id cuando es creación
            if (customer.id === null || customer.id === undefined) delete customer.id;

            if (customer.id !== undefined) {
                // edición -> PUT
                const res = await fetch(apiUrl, { 
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(customer) });
                if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error al editar'); }
                // Muestro mensaje en inglés dentro del formulario durante 2s y luego cierro
                await showFormMessage('success', 'Customer edited successfully.');
            } else {
                // creación -> POST
                const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(customer) });
                if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error al crear'); }
                // Muestro mensaje en inglés dentro del formulario durante 2s y luego cierro
                await showFormMessage('success', 'Customer created successfully.');
            }
            // After showing the message, showFormMessage already hides the modal.
            await fetchCustomers();
        } catch (err) {
            console.error(err);
            showMsg('error','Failed to save: ' + (err.message || err));
        }
    }

    // Borrar un customer por id (DELETE)
    // Muestro un modal de confirmación antes de llamar al servidor.
    async function customersDelete(id) {
        try {
            const ok = await showConfirm('Do you want to delete this customer?');
            if (!ok) return;
            const res = await fetch(apiUrl + '/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' });
            if (!res.ok) { const t = await res.text(); throw new Error(t || 'Error deleting'); }
            showMsg('success','Customer deleted');
            await fetchCustomers();
        } catch (err) {
            console.error(err);
            showMsg('error','Could not delete: ' + err.message);
        }
    }

    // Muestro un modal de confirmación con mensaje y botones Yes/No.
    // Devuelvo una Promise que se resuelve en true si el usuario confirma.
    function showConfirm(message) {
        return new Promise((resolve) => {
            if (!confirmContainer || !confirmYesBtn || !confirmNoBtn || !confirmMessageEl) {
                // Si no existe el modal, uso el confirm nativo como fallback
                resolve(window.confirm(message));
                return;
            }

            confirmMessageEl.textContent = message;
            confirmContainer.classList.remove('hidden');
            confirmContainer.setAttribute('aria-hidden', 'false');

            // Handlers
            const cleanUp = () => {
                confirmContainer.classList.add('hidden');
                confirmContainer.setAttribute('aria-hidden', 'true');
                confirmYesBtn.removeEventListener('click', onYes);
                confirmNoBtn.removeEventListener('click', onNo);
                confirmContainer.removeEventListener('click', onBackdrop);
                document.removeEventListener('keydown', onKey);
            };

            const onYes = () => { cleanUp(); resolve(true); };
            const onNo = () => { cleanUp(); resolve(false); };
            const onBackdrop = (e) => { if (e.target === confirmContainer) { cleanUp(); resolve(false); } };
            const onKey = (e) => { if (e.key === 'Escape') { cleanUp(); resolve(false); } };

            confirmYesBtn.addEventListener('click', onYes);
            confirmNoBtn.addEventListener('click', onNo);
            confirmContainer.addEventListener('click', onBackdrop);
            document.addEventListener('keydown', onKey);
        });
    }

    // Exponer funciones globales para compatibilidad con botones dinámicos
    // y facilitar pruebas desde la consola. Yo lo dejo intencionadamente global.
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
            document.getElementById('formTitle').textContent = 'Create Customer';
            showForm(false);
        } else {
            hideForm();
        }
    });
    if (cancelBtn) cancelBtn.addEventListener('click', hideForm);

    // Si el usuario hace click fuera del contenido del modal (backdrop), lo cierro.
    if (formContainer) {
        formContainer.addEventListener('click', (e) => {
            if (e.target === formContainer) hideForm();
        });
    }

    // --- Help (H5P) handlers: abro/cierro el modal y cargo el player interactivo ---
    let h5pInstance = null;

    function getContextPath() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const first = parts[0];
        if (!first || first.includes('.')) return '';
        return '/' + first;
    }

    function loadScriptOnce(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[data-src="' + src + '"]')) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.dataset.src = src;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }

    async function ensureH5P() {
        if (!helpH5pContainer) return;
        if (h5pInstance) return;

        const ctx = getContextPath();
        const base = ctx + '/assets';
        const options = {
            h5pJsonPath: base + '/h5p-content',
            frameJs: base + '/h5p-player/frame.bundle.js',
            frameCss: base + '/h5p-player/styles/h5p.css',
            librariesPath: base + '/h5p-libraries'
        };

        // Cargo el bundle principal que define H5PStandalone
        await loadScriptOnce(base + '/h5p-player/main.bundle.js');
        if (!window.H5PStandalone || !window.H5PStandalone.H5P) {
            throw new Error('H5PStandalone not available');
        }

        // Instancio el player H5P dentro del contenedor
        h5pInstance = new window.H5PStandalone.H5P(helpH5pContainer, options);
    }

    function openHelp() {
        if (!helpVideoModal) return;
        helpVideoModal.classList.remove('hidden');
        helpVideoModal.setAttribute('aria-hidden', 'false');
        // cargo H5P (si no está cargado) y muestro el contenido
        ensureH5P().catch((err) => {
            console.error('Failed to load H5P:', err);
            showMsg('error', 'Could not load interactive video. Check paths.');
        });
        // foco en el botón cerrar
        if (helpCloseBtn) helpCloseBtn.focus();
    }

    function closeHelp() {
        if (!helpVideoModal) return;
        helpVideoModal.classList.add('hidden');
        helpVideoModal.setAttribute('aria-hidden', 'true');
        if (createBtn) createBtn.focus();
    }

    if (helpBtn) helpBtn.addEventListener('click', (e) => { e.preventDefault(); openHelp(); });
    if (helpCloseBtn) helpCloseBtn.addEventListener('click', (e) => { e.preventDefault(); closeHelp(); });
    if (helpVideoModal) helpVideoModal.addEventListener('click', (e) => { if (e.target === helpVideoModal) closeHelp(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && helpVideoModal && !helpVideoModal.classList.contains('hidden')) closeHelp(); });

    // Inicio: cargo la lista de customers al cargar la página
    
    fetchCustomers();
});