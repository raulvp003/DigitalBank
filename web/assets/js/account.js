/*
 =========
 CONSTANTS
 =========
*/
/*A*/
/*B*/
const BASE_URL = "/CRUDBankServerSide/webresources/account";
let deleteMode = false;

let responseMsgAccount = document.getElementById("responseMsgCreate");


function mostrarError(mensaje){
    responseMsgAccount.textContent = mensaje;
    responseMsgAccount.classList.add("error");
    responseMsgAccount.style.display = "block";
}

/**
* @todo Formatear importes (balance, beginBalance y creditLine con separadores de miles y de decimales(máximo 2).

 =========
 GENERATOR 
 =========
*/
function* accountRowGenerator(accounts){
    for (const acc of accounts) {
        const tr = document.createElement("tr");

        // Columna checkbox SOLO en deleteMode
        if (deleteMode) {
            const checkTd = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = acc.id;
            checkbox.classList.add("delete-checkbox");
            checkbox.setAttribute("aria-label", "Select account " + acc.id);

            checkTd.appendChild(checkbox);
            tr.appendChild(checkTd);
        }

        const fields = [
            "id",
            "description",
            "type",
            "balance",
            "creditLine",
            "beginBalance",
            "beginBalanceTimestamp"
        ];

        fields.forEach(field => {
            const td = document.createElement("td");
            if (field === "beginBalanceTimestamp") {
                // Convertir string ISO a Date
                const date = new Date(acc[field]);
                // Formatear con Intl.DateTimeFormat en inglés
                td.textContent = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    
                    hour12: false
                }).format(date);
            } else if (field === "balance" || field === "creditLine" || field === "beginBalance"){
                td.textContent = new Intl.NumberFormat ('es-ES',{
                    style: 'currency',
                    currency: 'EUR',
                    minimunFractionDigits: 2
                }).format(acc[field]);
                
            }else {
                td.textContent = acc[field];
            }
            tr.appendChild(td);
        });
        
        // === ACCIONES ===
        const actionsTd = document.createElement("td");

        const movBtn = document.createElement("button");
        movBtn.type = "button";
        movBtn.textContent = "Movements";
        movBtn.classList.add("submit-btn");
        movBtn.setAttribute("aria-label", "View movements of account " + acc.id);
        movBtn.onclick = () => goToMovements(acc);

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Modify";
        editBtn.classList.add("submit-btn");
        editBtn.setAttribute("aria-label", "Modify account " + acc.id);
        editBtn.onclick = () => showUpdateForm(acc);

        actionsTd.appendChild(movBtn);
        actionsTd.appendChild(editBtn);
        tr.appendChild(actionsTd);         


        yield tr;
    }
}

/*
 ====================
 FETCH ACCOUNTS (XML)
 ====================
*/
async function fetchAccountsByCustomerId(customerId) {
    const response = await fetch(`${BASE_URL}/customer/${customerId}`, {
        headers: { "Accept": "application/xml" }
    });

    if (!response.ok) {
        throw new Error("Error fetching accounts");
    }

    const xmlText = await response.text();
    return parseAccountsXML(xmlText);
}

/*
 ===========================
 PARSE XML → ACCOUNT OBJECTS
 ===========================
*/
function parseAccountsXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const accounts = [];
    const accountNodes = xmlDoc.getElementsByTagName("account");

    for (const accountNode of accountNodes) {
        const id = accountNode.querySelector(":scope > id").textContent.trim();
        const description = accountNode.querySelector(":scope > description").textContent.trim();
        const balance = Number(accountNode.querySelector(":scope > balance").textContent);
        const creditLine = Number(accountNode.querySelector(":scope > creditLine").textContent);
        const beginBalance = Number(accountNode.querySelector(":scope > beginBalance").textContent);
        const beginBalanceTimestamp =
            accountNode.querySelector(":scope > beginBalanceTimestamp").textContent.trim();
        const typeValue = accountNode.querySelector(":scope > type").textContent.trim();

        const type = typeValue === "CREDIT" ? "CREDIT" : "STANDARD";

        accounts.push(
            new Account(
                id,
                description,
                balance,
                creditLine,
                beginBalance,
                beginBalanceTimestamp,
                type
            )
        );
    }
    return accounts;
}
/*
function parseAccountsXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const accounts = [];
    const accountNodes = xmlDoc.getElementsByTagName("account");

    for (const accountNode of accountNodes) {
        const id = accountNode.getElementsByTagName("id")[0].textContent.trim();
        const description = accountNode.getElementsByTagName("description")[0].textContent.trim();
        const balance = Number(accountNode.getElementsByTagName("balance")[0].textContent);
        const creditLine = Number(accountNode.getElementsByTagName("creditLine")[0].textContent);
        const beginBalance = Number(accountNode.getElementsByTagName("beginBalance")[0].textContent);
        const beginBalanceTimestamp = accountNode.getElementsByTagName("beginBalanceTimestamp")[0].textContent.trim();
        const typeValue = accountNode.getElementsByTagName("type")[0].textContent.trim();

        const type = typeValue === "CREDIT" || typeValue === "1" ? "CREDIT" : "STANDARD";

        accounts.push(
            new Account(
                id,
                description,
                balance,
                creditLine,
                beginBalance,
                beginBalanceTimestamp,
                type
            )
        );
    }
    return accounts;
}*/
/* 
 ===========
 BUILD TABLE
 ===========
*/
async function buildAccountsTable() {
    const customerId = sessionStorage.getItem("customer.id");
    
    //Llamada funcion delete mode
    rebuildTableHeader();

    if (!customerId) {
        alert("User not logged in");
        window.location.href = "../signin/signin.html";
        return;
    }

    try {
        const accounts = await fetchAccountsByCustomerId(customerId);
        const tbody = document.querySelector("#accountsTable tbody");
        tbody.innerHTML = "";

        const rowGenerator = accountRowGenerator(accounts);
        for (const row of rowGenerator) {
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        alert("Could not load accounts");
    }
}




/*
 ====================================
 JS PARA MOSTRAR / OCULTAR FORMULARIO
 ====================================
*/
function showCreateAccountForm() {
    document.getElementById("createAccountContainer").style.display = "block";
}

function hideCreateAccountForm() {
    document.getElementById("createAccountContainer").style.display = "none";
    document.getElementById("createAccountForm").reset();
    toggleCreditLine();
}

/*
 =============================
 MOSTRAR / OCULTAR CREDIT LINE
 =============================
*/
function toggleCreditLine() {
    const type = document.getElementById("type").value;
    const creditLineContainer = document.getElementById("creditLineContainer");

    if (type === "1") {
        creditLineContainer.style.display = "block";
    } else {
        creditLineContainer.style.display = "none";
        document.getElementById("creditLine").value = 0;
    }
}

/*
 ==============
 CREATE ACCOUNT
 ==============
*/
document.getElementById("createAccountForm").addEventListener("submit", createAccount);
/**
 * 
 * @param {type} event
 * @return {undefined}
 * @fixme Al crear la cuenta se debe poder establecer por parte del usuario el saldo inicial de la cuenta (beginBalance). El saldo actual (balance) en el momento de la apertura será igual al saldo inicial.
 */
async function createAccount(event) {
    event.preventDefault();

    const customerId = sessionStorage.getItem("customer.id");
    if (!customerId) {
        alert("User not logged in");
        return;
    }

    const description = document.getElementById("description").value.trim();
    const beginBalanceInput = document.getElementById("beginBalance").value.trim();
    const typeValue = document.getElementById("type").value;
    const creditLineInput = document.getElementById("creditLine").value.trim();

    if (!description) {
        alert("Description is required");
        return;
    }

    const id = Date.now(); // generado en cliente
    //FIXME ver @fixme anterior
    //TODO Utilizar la siguiente RegExp para validar que los importes (balance,beginBalance y creditLine) puedan introducirse con separador de decimales y de miles.
    const esAmountRegex = /^(?:\d{1,15}|\d{1,3}(?:\.\d{3}){1,4})(?:,\d{1,2})?$/;
        /* Explanation for esAmountRegex:
          (?:                                # integer part options
            \d{1,15}                         # 1 to 15 digits without thousand separator
            | \d{1,3}(?:\.\d{3}){1,4}        # 1–3 digits, then 1–4 groups of ".ddd"
           )
          (?:,\d{1,2})?                      # optional decimal with 1 or 2 digits
         */
    /*
    const beginBalance = 100;
    const balance = 100;*/
    if (beginBalanceInput === "" || !esAmountRegex.test(beginBalanceInput)) {
        let mensaje = "";

        if (beginBalanceInput === "")
            mensaje = "You must enter an initial balance (Ej: 5.000,00).";
        else
            mensaje = "Balance must be a number with up to 2 decimals (Ej: 5.000,00).";

        mostrarError(mensaje);
        return;
    }

    let normalized = beginBalanceInput
        .replace(/\./g, "")   
        .replace(",", ".");   

    const beginBalance = parseFloat(normalized);

    if (beginBalance < 0) {
        mostrarError("Initial balance cannot be negative.");
        return;
    }

    const balance = beginBalance;
    
    const beginBalanceTimestamp = new Date().toISOString();

    let type;
    let creditLine = 0;

    if (typeValue === "0") {
        type = "STANDARD";
        creditLine = 0;
    } else {
        type = "CREDIT";

        if (creditLineInput === "" || !esAmountRegex.test(creditLineInput)) {
            let mensaje = "";

            if (creditLineInput === "")
                mensaje = "Credit Line must have an initial value (Ej: 5.000,00).";
            else
                mensaje = "Credit Line must comply with the format (Ej: 5.000,00); it does not accept letters or negative numbers.";

            mostrarError(mensaje);
            return;
        }
        
        normalized = creditLineInput
            .replace(/\./g, "")   
            .replace(",", ".");
    
        creditLine = parseFloat(normalized);

        if (creditLine < 0 || creditLine > 10000){
            if (creditLine < 0)           
                mostrarError("Initial Credit Line cannot be negative.");
            
            else
                mostrarError("The initial credit line cannot exceed the value of 10000.");
            return;
        }
    }    

    const xml = `
    <account>
        <id>${id}</id>
        <description>${description}</description>
        <balance>${balance}</balance>
        <creditLine>${creditLine}</creditLine>
        <beginBalance>${beginBalance}</beginBalance>
        <beginBalanceTimestamp>${beginBalanceTimestamp}</beginBalanceTimestamp>
        <type>${type}</type>
        <customers>
            <id>${customerId}</id>
        </customers>
    </account>
    `.trim();
        
    try {
        const response = await fetch(
            "/CRUDBankServerSide/webresources/account",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/xml"
                },
                body: xml
            }
        );

        if (!response.ok)
            throw new Error("Error creating account");

        alert("Account created successfully");

        // limpiar formulario
        event.target.reset();
        toggleCreditLine();

        // recargar tabla de cuentas
        hideCreateAccountForm();
        await buildAccountsTable();
        
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
}

/*
 ==============
 DELETE ACCOUNT
 ==============   
*/
async function deleteAccount(accountId) {
    if (!confirm("Are you sure you want to delete this account?"))
        return;

    try {
        const response = await fetch(
            `${BASE_URL}/${accountId}`,
            { method: "DELETE" }
        );

        if (!response.ok)
            throw new Error("Error deleting account");

        alert("Account deleted successfully");
        await buildAccountsTable();

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
}
/*
 ==========================================
 AJUSTAR <HEAD> CUANDO ENTRA EN DELETE MODE 
 ==========================================
*/
function rebuildTableHeader() {
    const thead = document.querySelector("#accountsTable thead tr");
    thead.innerHTML = "";

    if (deleteMode) {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.textContent = "";
        thead.appendChild(th);
    }

    const headers = [
        "ID",
        "Description",
        "Type",
        "Balance",
        "Credit Line",
        "Begin Balance",
        "Begin Balance Date",
        "Actions"
    ];

    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        th.setAttribute("scope", "col");
        thead.appendChild(th);
    });
}
/*
 ==============================
 ACTIVAR/DESACTIVAR DELETE MODE
 ==============================
*/
async function toggleDeleteMode() {
    deleteMode = !deleteMode;

    document.getElementById("confirmDeleteBtn").style.display =
        deleteMode ? "inline-block" : "none";

    await buildAccountsTable();
}

/*
 ================================
 CONFIRMAR Y BORRAR SELECCIONADAS
 ================================
*/
async function accountHasMovements(accountId) {
    const response = await fetch(
        `/CRUDBankServerSide/webresources/movement/account/${accountId}`,
        { headers: { "Accept": "application/xml" } }
    );

    if (!response.ok) {
        throw new Error("Error checking movements");
    }

    const xmlText = await response.text();
    const xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");
    const movements = xmlDoc.getElementsByTagName("movement");

    return movements.length > 0;
}


async function confirmDelete() {
    const checked = document.querySelectorAll(".delete-checkbox:checked");

    if (checked.length === 0) {
        alert("Select at least one account");
        return;
    }
    
    // 1. Comprobar movimientos
    for (const cb of checked) {
        const accountId = cb.value;

        const hasMovements = await accountHasMovements(accountId);

        if (hasMovements) {
            alert(`Account ${accountId} has movements and cannot be deleted.`);
            return;
        }
    }    
    
    // 2. Confirmación final
    if (!confirm(`Delete ${checked.length} account(s)? It's irreversible.`))
        return;

    try {
        for (const cb of checked) {
            const accountId = cb.value;

            const response = await fetch(
                `${BASE_URL}/${accountId}`,
                { method: "DELETE" }
            );

            if (!response.ok)
                throw new Error(`Error deleting account ${accountId}`);
        }

        alert("Accounts deleted successfully");

        deleteMode = false;
        document.getElementById("confirmDeleteBtn").style.display = "none";
        await buildAccountsTable();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}



/*
 ==============
 UPDATE ACCOUNT
 ==============
*/
document.getElementById("updateAccountForm").addEventListener("submit", updateAccount);

async function updateAccount(event){
    event.preventDefault();

    const newDescription = document.getElementById("updateDescription").value.trim();
    let newCreditLine = accountToUpdate.creditLine;
    responseMsgAccount = document.getElementById("responseMsgUpdate");

    if(accountToUpdate.type === "CREDIT"){
        newCreditLine = document.getElementById("updateCreditLine").value.trim();
    }
    //TODO Utilizar la siguiente RegExp para validar que creditLine pueda introducirse con separador de decimales y de miles.
    const esAmountRegex = /^(?:\d{1,15}|\d{1,3}(?:\.\d{3}){1,4})(?:,\d{1,2})?$/;
        /* Explanation for esAmountRegex:
          (?:                                # integer part options
            \d{1,15}                         # 1 to 15 digits without thousand separator
            | \d{1,3}(?:\.\d{3}){1,4}        # 1–3 digits, then 1–4 groups of ".ddd"
           )
          (?:,\d{1,2})?                      # optional decimal with 1 or 2 digits
         */

        if (newCreditLine === "" || !esAmountRegex.test(newCreditLine)) {
            let mensaje = "";

            if (newCreditLine === "")
                mensaje = "Credit Line must have an initial value (Ej: 5.000,00).";
            else
                mensaje = "Credit Line must comply with the format (Ej: 5.000,00); it does not accept letters or negative numbers.";

            mostrarError(mensaje);
            return;
        }
        
        let normalized = newCreditLine
            .replace(/\./g, "")   
            .replace(",", ".");
    
        newCreditLine = parseFloat(normalized);

        if (newCreditLine < 0 || newCreditLine > 10000){
            if (newCreditLine < 0)           
                mostrarError("Initial Credit Line cannot be negative.");
            
            else
                mostrarError("The initial credit line cannot exceed the value of 10000.");
            return;
        }


    const xml = `
    <account>
        <id>${accountToUpdate.id}</id>
        <description>${newDescription}</description>
        <balance>${accountToUpdate.balance}</balance>
        <creditLine>${newCreditLine}</creditLine>
        <beginBalance>${accountToUpdate.beginBalance}</beginBalance>
        <beginBalanceTimestamp>${accountToUpdate.beginBalanceTimestamp}</beginBalanceTimestamp>
        <type>${accountToUpdate.type}</type>
        <customers>
            <id>${sessionStorage.getItem("customer.id")}</id>
            <city>${sessionStorage.getItem("customer.city")}</city>
            <email>${sessionStorage.getItem("customer.email")}</email>
            <firstName>${sessionStorage.getItem("customer.firstName")}</firstName>
            <lastName>${sessionStorage.getItem("customer.lastName")}</lastName>
            <middleInitial>${sessionStorage.getItem("customer.middleInitial")}</middleInitial>
            <password>${sessionStorage.getItem("customer.password")}</password>
            <phone>${sessionStorage.getItem("customer.phone")}</phone>
            <state>${sessionStorage.getItem("customer.state")}</state>
            <street>${sessionStorage.getItem("customer.street")}</street>
            <zip>${sessionStorage.getItem("customer.zip")}</zip>     
        </customers>
    </account>
    `.trim();

    try{
        const response = await fetch(BASE_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/xml"
            },
            body: xml
        });

        if(!response.ok) throw new Error("Error updating account");

        alert("Account updated");
        hideUpdateForm();
        buildAccountsTable();

    }catch(err){
        alert(err.message);
    }
}


/*
 ================================
 GUARDAR CUENTAS E IR A MOVEMENTS
 ================================
*/
/*
function goToMovements(account){
    sessionStorage.setItem("account", JSON.stringify(account));
    window.location.href = "movements.html";
}*/
function goToMovements(account) {
    // Obtener todos los IDs de las cuentas en la tabla
    const tbody = document.querySelector("#accountsTable tbody");
    const rows = tbody.querySelectorAll("tr");

    const accountIds = Array.from(rows).map(row => {
        // El primer td visible es el ID, si no estás en deleteMode
        // Si estás en deleteMode, ajusta index según corresponda
        let idCellIndex = deleteMode ? 1 : 0;
        return row.cells[idCellIndex].textContent.trim();
    });

    sessionStorage.setItem("accountIds", JSON.stringify(accountIds));
    window.location.href = "MovementsPage.html";
}


/*
 ============================
 MOSTRAR FORMULARIO CON DATOS
 ============================
*/
let accountToUpdate = null;

function showUpdateForm(account){
    accountToUpdate = account;

    document.getElementById("updateAccountContainer").style.display = "block";
    document.getElementById("updateDescription").value = account.description;

    if(account.type === "CREDIT"){
        document.getElementById("updateCreditLineContainer").style.display = "block";
        document.getElementById("updateCreditLine").value = account.creditLine;
    } else {
        document.getElementById("updateCreditLineContainer").style.display = "none";
    }
}

function hideUpdateForm(){
    document.getElementById("updateAccountContainer").style.display = "none";
}

/*
 =====
 VIDEO
 =====
*/
let tutorialVisible = false;
let h5pInstance = null;

function toggleTutorial() {
    const box = document.getElementById("tutorialBox");
    const container = document.getElementById("h5p-container");

    tutorialVisible = !tutorialVisible;
    box.style.display = tutorialVisible ? "block" : "none";

    // Crear el H5P SOLO la primera vez que se abre
    if (tutorialVisible && !h5pInstance) {
        const options = {
            h5pJsonPath: '/DigitalBank/assets/h5p-account',
            frameJs: '/DigitalBank/assets/h5p-player/frame.bundle.js',
            frameCss: '/DigitalBank/assets/h5p-player/styles/h5p.css',
            librariesPath: '/DigitalBank/assets/h5p-libraries'
        };

        h5pInstance = new H5PStandalone.H5P(container, options);
    }
}




/* 
 =======
 ON LOAD
 =======
*/
buildAccountsTable();

