/*
 =========
 CONSTANTS
 =========
*/
const BASE_URL = "/CRUDBankServerSide/webresources/account";
let deleteMode = false;

/*
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
                const date = new Date(acc[field]);
                td.textContent = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(date);
            } else {
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
 FETCH ACCOUNTS (JSON)
 ====================
*/
async function fetchAccountsByCustomerId(customerId) {
    const response = await fetch(`${BASE_URL}/customer/${customerId}`, {
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error("Error fetching accounts");

    return await response.json();
}

/* 
 ===========
 BUILD TABLE
 ===========
*/
async function buildAccountsTable() {
    const customerId = sessionStorage.getItem("customer.id");
    
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
 SHOW / HIDE CREATE FORM
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
 SHOW / HIDE CREDIT LINE
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
 CREATE ACCOUNT (JSON)
 ==============
*/
document.getElementById("createAccountForm").addEventListener("submit", createAccount);

async function createAccount(event) {
    event.preventDefault();

    const customerId = sessionStorage.getItem("customer.id");
    if (!customerId) {
        alert("User not logged in");
        return;
    }

    const description = document.getElementById("description").value.trim();
    const typeValue = document.getElementById("type").value;
    const creditLineInput = document.getElementById("creditLine").value;

    const id = Date.now();
    const beginBalance = 100;
    const balance = 100;
    const beginBalanceTimestamp = new Date().toISOString();

    let type = "STANDARD";
    let creditLine = 0;

    if (typeValue === "1") {
        type = "CREDIT";
        creditLine = Number(creditLineInput);
    }

    const account = {
        id,
        description,
        balance,
        creditLine,
        beginBalance,
        beginBalanceTimestamp,
        type,
        customers: [{ id: customerId }]
    };

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
    });

    if (!response.ok) throw new Error("Error creating account");

    alert("Account created");
    hideCreateAccountForm();
    buildAccountsTable();
}

/*
 ==============
 DELETE ACCOUNT
 ==============   
*/
async function deleteAccount(accountId) {
    if (!confirm("Are you sure?")) return;

    const response = await fetch(`${BASE_URL}/${accountId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error deleting account");

    alert("Account deleted");
    buildAccountsTable();
}

/*
 ==========================================
 REBUILD HEADER
 ==========================================
*/
function rebuildTableHeader() {
    const thead = document.querySelector("#accountsTable thead tr");
    thead.innerHTML = "";

    if (deleteMode) {
        const th = document.createElement("th");
        thead.appendChild(th);
    }

    const headers = [
        "ID","Description","Type","Balance","Credit Line","Begin Balance","Begin Balance Date","Actions"
    ];

    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        thead.appendChild(th);
    });
}

/*
 ==============================
 DELETE MODE
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
 CHECK MOVEMENTS
 ================================
*/
async function accountHasMovements(accountId) {
    const response = await fetch(`/CRUDBankServerSide/webresources/movement/account/${accountId}`, {
        headers: { "Accept": "application/json" }
    });

    const movements = await response.json();
    return movements.length > 0;
}

async function confirmDelete() {
    const checked = document.querySelectorAll(".delete-checkbox:checked");

    for (const cb of checked) {
        if (await accountHasMovements(cb.value)) {
            alert(`Account ${cb.value} has movements`);
            return;
        }
    }

    for (const cb of checked) {
        await fetch(`${BASE_URL}/${cb.value}`, { method: "DELETE" });
    }

    alert("Deleted");
    deleteMode = false;
    buildAccountsTable();
}

/*
 ==============
 UPDATE ACCOUNT (JSON)
 ==============
*/
document.getElementById("updateAccountForm").addEventListener("submit", updateAccount);

let accountToUpdate = null;

async function updateAccount(event){
    event.preventDefault();

    const newDescription = document.getElementById("updateDescription").value.trim();
    let newCreditLine = accountToUpdate.creditLine;

    if(accountToUpdate.type === "CREDIT"){
        newCreditLine = document.getElementById("updateCreditLine").value;
    }

    const account = {
        ...accountToUpdate,
        description: newDescription,
        creditLine: newCreditLine,
        customers: [{
            id: sessionStorage.getItem("customer.id")
        }]
    };

    const response = await fetch(BASE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
    });

    if (!response.ok) throw new Error("Error updating");

    alert("Updated");
    hideUpdateForm();
    buildAccountsTable();
}

function showUpdateForm(account){
    accountToUpdate = account;
    document.getElementById("updateAccountContainer").style.display = "block";
    document.getElementById("updateDescription").value = account.description;
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

