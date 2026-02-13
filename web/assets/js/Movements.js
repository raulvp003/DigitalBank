/*FIXM Usar la clase movement definida en clases.js 
 * 
 * crear operacion agregada
 * 
 * validar numero introducido con expresiones regulares
 * 
 * quitar todo js y css del html
 * 
 * revisar peticiones al server, si sobran, faltan fetchs...
 * 
 * quitar linea que da cuentas default
 * 
 * formatear importes*/

const url = "/CRUDBankServerSide/webresources/movement";
// Simulamos cuentas

let accountIds = JSON.parse(sessionStorage.getItem("accountIds")) || [];

if (accountIds.length === 0) {
    alert("No hay cuentas para mostrar");

    accountIds = JSON.parse(sessionStorage.getItem("accountIds")) || ["1569874954", "2654785441"];

}

let activeAccountId = accountIds[0]; // por defecto

document.addEventListener("DOMContentLoaded", () => {
    setupAccountSelector();
    cargarMovimientos();

    document.getElementById("btnCreateMovement").addEventListener("click", createMovementsHandler);
    document.getElementById("movementForm").addEventListener("submit", movementCreator);
    document.getElementById("undoCancel").addEventListener("click", () => {
    document.getElementById("undoModal").style.display = "none";
    });

    document.getElementById("btnUndoMovement").addEventListener("click", () => {
        document.getElementById("undoModal").style.display = "flex";
    });
    document.getElementById("undoForm").addEventListener("submit", undoLastMovement);
    
});

// --- Selector de cuentas ---
function setupAccountSelector() {
    const selector = document.getElementById("accountSelector");
    selector.innerHTML = "";

    accountIds.forEach(id => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = id;
        selector.appendChild(option);
    });

    selector.value = activeAccountId;
    selector.addEventListener("change", () => {
        activeAccountId = selector.value;
        cargarMovimientos();
    });
}


// --- Cargar movimientos ---
async function cargarMovimientos() {
    const container = document.getElementById("accountsContainer");
    container.innerHTML = ""; // limpiar tablas previas

    try {
        for (const accountId of accountIds) {
            const response = await fetch(`${url}/account/${accountId}`, {
                headers: {"Accept": "application/json"}
            });
            if (!response.ok)
                throw new Error(`Error cargando movimientos de la cuenta ${accountId}`);

            const movimientos = await response.json();
            const totalBalance = movimientos.length > 0
                    ? movimientos[movimientos.length - 1].balance
                    : 0;

            // Crear wrapper para scroll horizontal en móviles
            const tableWrapper = document.createElement("div");
            tableWrapper.classList.add("table-wrapper"); // clase para CSS responsive
            tableWrapper.style.marginBottom = "30px";

            // Encabezado de la cuenta
            const accountHeader = document.createElement("h2");
            accountHeader.innerHTML = `Current Balance: ${totalBalance.toFixed(2)}`;
            tableWrapper.appendChild(accountHeader);

            // Crear la tabla
            const table = document.createElement("table");
            table.classList.add("Table");
            table.style.width = "100%";

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th>Timestamp</th>
                        <th>Operation</th>
                    </tr>
                </thead>
            `;

            const tbody = document.createElement("tbody");
            tbody.id = `movementsList-${accountId}`;

            if (movimientos.length === 0) {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td colspan="5">No movements yet!</td>`;
                tbody.appendChild(tr);
            } else {
                movimientos.forEach(m => {
                    const tr = document.createElement("tr");
                    const formattedTimestamp = m.timestamp
                            ? new Date(m.timestamp).toLocaleString()
                            : '';
                    tr.innerHTML = `
                        <td data-label="ID">${m.id}</td>
                        <td data-label="Amount">${m.amount.toFixed(2)}</td>
                        <td data-label="Balance">${m.balance.toFixed(2)}</td>
                        <td data-label="Timestamp">${formattedTimestamp}</td>
                        <td data-label="Operation">${m.description}</td>
                    `;
                    tr.classList.add(m.amount >= 0 ? "income" : "expense");
                    tbody.appendChild(tr);
                });
            }

            table.appendChild(tbody);
            tableWrapper.appendChild(table);

            // Mostrar solo la tabla de la cuenta activa
            tableWrapper.style.display = accountId === activeAccountId ? "block" : "none";
            container.appendChild(tableWrapper);
        }
    } catch (error) {
        container.innerHTML = `<p style="color:red">Error cargando movimientos: ${error.message}</p>`;
    }
}


// --- Crear movimientos ---
function createMovementsHandler() {
    const movementModal = document.getElementById("movementModal");
    movementModal.style.display = "flex";

    const btnCancel = document.getElementById("btnCancel");
    btnCancel.addEventListener("click", () => {
        movementModal.style.display = "none";
    });
}

async function movementCreator(event) {
    event.preventDefault();

    try {
        const amountInput = parseFloat(document.getElementById("amount").value);
        const operation = document.getElementById("Operation").value;

        if (isNaN(amountInput) || amountInput <= 0)
            throw new Error("Amount must be a valid number");

        // Tomamos la cuenta activa
        const tbody = document.getElementById(`movementsList-${activeAccountId}`);
        let previousBalance = 0;
        if (tbody && tbody.rows.length > 0) {
            const lastRow = tbody.rows[tbody.rows.length - 1];

            // Ignorar la fila "No movements yet!"
            if (lastRow.cells.length >= 3) {
                previousBalance = parseFloat(lastRow.cells[2].textContent) || 0;
            }
        }


        let totalBalance = operation === "Deposit" ? previousBalance + amountInput : previousBalance - amountInput;
        if (operation === "Payment" && amountInput > previousBalance)
            throw new Error("Insufficient balance");

        const movementData = {
            amount: operation === "Payment" ? -amountInput : amountInput,
            balance: totalBalance,
            description: operation,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${url}/${activeAccountId}`, {
            method: "POST",
            headers: {"Content-Type": "application/json", "Accept": "application/json"},
            body: JSON.stringify(movementData)
        });

        if (!response.ok)
            throw new Error(await response.text() || "Error creating movement");

        document.getElementById("movementForm").reset();
        document.getElementById("movementModal").style.display = "none";
        cargarMovimientos();
        alert("Movement created successfully");
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// --- Deshacer último movimiento ---
async function recargaCuenta(movimientos) {
    // Obtener la cuenta completa
    const accountResponse = await fetch(`http://localhost:8080/CRUDBankServerSide/webresources/account/${activeAccountId}`, {
        headers: {"Accept": "application/json"}
    });

    if (!accountResponse.ok)
        throw new Error("No se pudo obtener la cuenta para actualizar");

    const account = await accountResponse.json();

    // Calcular el nuevo balance
    const newBalance = movimientos.length > 1
            ? movimientos[movimientos.length - 2].balance
            : 0;

    account.balance = newBalance;

    // Enviar PUT con la cuenta completa
    const updateResponse = await fetch(`http://localhost:8080/CRUDBankServerSide/webresources/account`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(account)
    });

    if (!updateResponse.ok)
        throw new Error("Error actualizando el balance de la cuenta");
}




async function undoLastMovement() {
    event.preventDefault(); 
    try {
        // Obtener movimientos
        const response = await fetch(`${url}/account/${activeAccountId}`, {
            headers: {"Accept": "application/json"}
        });

        if (!response.ok)
            throw new Error(`Error al obtener movimientos: ${response.status}`);

        const movimientos = await response.json();

        if (movimientos.length === 0) {
            alert("No hay movimientos para deshacer");
            return;
        }

        // Borrar último movimiento
        const lastMovement = movimientos[movimientos.length - 1];

        const deleteResponse = await fetch(`${url}/${lastMovement.id}`, {
            method: "DELETE",
            headers: {"Accept": "application/json"}
        });

        if (!deleteResponse.ok)
            throw new Error(`No se pudo deshacer el movimiento: ${deleteResponse.status}`);

        // Actualizar balance de la cuenta
        await recargaCuenta(movimientos);

        // Recargar lista
        await cargarMovimientos();
        document.getElementById("undoModal").style.display = "none";

        alert("Último movimiento deshecho correctamente");

    } catch (error) {
        alert("Error: " + error.message);
    }
}
