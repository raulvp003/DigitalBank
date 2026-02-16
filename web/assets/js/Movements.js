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

let accountIds = JSON.parse(sessionStorage.getItem("accountIds")) || [];

if (accountIds.length === 0) {
    alert("No hay cuentas para mostrar");
    accountIds = JSON.parse(sessionStorage.getItem("accountIds")) || ["1569874954", "2654785441"];
}

let activeAccountId = accountIds[0];

// Format currency amounts with thousands separator and 2 decimals
function formatAmount(amount) {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

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
    
    document.getElementById("btnShowStats").addEventListener("click", showStatistics);
});

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

async function cargarMovimientos() {
    const container = document.getElementById("accountsContainer");
    container.innerHTML = "";

    try {
        const response = await fetch(`${url}/account/${activeAccountId}`, {
            headers: {"Accept": "application/json"}
        });
        
        if (!response.ok)
            throw new Error(`Error cargando movimientos de la cuenta ${activeAccountId}`);

        const movimientosData = await response.json();
        
        // Convert JSON data to Movement class instances
        const movimientos = movimientosData.map(m => 
            new Movement(m.id, m.timestamp, m.amount, m.balance, m.description)
        );
        
        const totalBalance = movimientos.length > 0
                ? movimientos[movimientos.length - 1].balance
                : 0;

        const tableWrapper = document.createElement("div");
        tableWrapper.classList.add("table-wrapper");
        tableWrapper.style.marginBottom = "30px";

        const accountHeader = document.createElement("h2");
        accountHeader.innerHTML = `Current Balance: ${formatAmount(totalBalance)} €`;
        tableWrapper.appendChild(accountHeader);

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
        tbody.id = `movementsList-${activeAccountId}`;

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
                    <td data-label="Amount">${formatAmount(m.amount)} €</td>
                    <td data-label="Balance">${formatAmount(m.balance)} €</td>
                    <td data-label="Timestamp">${formattedTimestamp}</td>
                    <td data-label="Operation">${m.description}</td>
                `;
                tr.classList.add(m.amount >= 0 ? "income" : "expense");
                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);

    } catch (error) {
        container.innerHTML = `<p style="color:red">Error cargando movimientos: ${error.message}</p>`;
    }
}

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

        // Validate input format: numbers with optional decimals (max 2 digits)
        const amountStr = document.getElementById("amount").value;
        const regexAmount = /^\d+(\.\d{1,2})?$/;
        
        if (!regexAmount.test(amountStr)) {
            throw new Error("Amount must be a valid number with up to 2 decimal places");
        }

        if (isNaN(amountInput) || amountInput <= 0) {
            throw new Error("Amount must be a positive number");
        }

        const tbody = document.getElementById(`movementsList-${activeAccountId}`);
        let previousBalance = 0;
        if (tbody && tbody.rows.length > 0) {
            const lastRow = tbody.rows[tbody.rows.length - 1];

            if (lastRow.cells.length >= 3) {
                // Remove formatting before parsing (converts "1.234,56 €" to float)
                const balanceText = lastRow.cells[2].textContent.replace(/[^\d,-]/g, '').replace(',', '.');
                previousBalance = parseFloat(balanceText) || 0;
            }
        }

        let totalBalance = operation === "Deposit" ? previousBalance + amountInput : previousBalance - amountInput;
        if (operation === "Payment" && amountInput > previousBalance) {
            throw new Error("Insufficient balance");
        }

        // Create Movement instance using the class definition
        const newMovement = new Movement(
            null,
            new Date().toISOString(),
            operation === "Payment" ? -amountInput : amountInput,
            totalBalance,
            operation
        );

        const response = await fetch(`${url}/${activeAccountId}`, {
            method: "POST",
            headers: {"Content-Type": "application/json", "Accept": "application/json"},
            body: JSON.stringify(newMovement)
        });

        if (!response.ok) {
            throw new Error(await response.text() || "Error creating movement");
        }

        document.getElementById("movementForm").reset();
        document.getElementById("movementModal").style.display = "none";
        cargarMovimientos();
        alert("Movement created successfully");
    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function undoLastMovement(event) {
    event.preventDefault(); 
    try {
        const response = await fetch(`${url}/account/${activeAccountId}`, {
            headers: {"Accept": "application/json"}
        });

        if (!response.ok) {
            throw new Error(`Error al obtener movimientos: ${response.status}`);
        }

        const movimientosData = await response.json();
        
        const movimientos = movimientosData.map(m => 
            new Movement(m.id, m.timestamp, m.amount, m.balance, m.description)
        );

        if (movimientos.length === 0) {
            alert("No hay movimientos para deshacer");
            document.getElementById("undoModal").style.display = "none";
            return;
        }

        const lastMovement = movimientos[movimientos.length - 1];

        const deleteResponse = await fetch(`${url}/${lastMovement.id}`, {
            method: "DELETE",
            headers: {"Accept": "application/json"}
        });

        if (!deleteResponse.ok) {
            throw new Error(`No se pudo deshacer el movimiento: ${deleteResponse.status}`);
        }

        // Calculate new balance from already-fetched data (avoids redundant fetch)
        const newBalance = movimientos.length > 1
                ? movimientos[movimientos.length - 2].balance
                : 0;

        const accountResponse = await fetch(`http://localhost:8080/CRUDBankServerSide/webresources/account/${activeAccountId}`, {
            headers: {"Accept": "application/json"}
        });

        if (!accountResponse.ok) {
            throw new Error("No se pudo obtener la cuenta para actualizar");
        }

        const account = await accountResponse.json();
        account.balance = newBalance;

        const putResponse = await fetch(`http://localhost:8080/CRUDBankServerSide/webresources/account`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(account)
        });

        if (!putResponse.ok) {
            throw new Error("Error actualizando el balance de la cuenta");
        }

        await cargarMovimientos();
        document.getElementById("undoModal").style.display = "none";

        alert("Último movimiento deshecho correctamente");

    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Aggregate operation: Calculate account statistics using reduce()
async function showStatistics() {
    try {
        const response = await fetch(`${url}/account/${activeAccountId}`, {
            headers: {"Accept": "application/json"}
        });

        if (!response.ok) {
            throw new Error(`Error fetching movements: ${response.status}`);
        }

        const movimientosData = await response.json();
        
        const movimientos = movimientosData.map(m => 
            new Movement(m.id, m.timestamp, m.amount, m.balance, m.description)
        );

        if (movimientos.length === 0) {
            alert("No movements to analyze");
            return;
        }

        // Aggregate all movements into a single statistics object
        const stats = movimientos.reduce((accumulator, movement) => {
            if (movement.amount > 0) {
                accumulator.totalIncome += movement.amount;
                accumulator.incomeCount++;
            }
            else if (movement.amount < 0) {
                accumulator.totalExpenses += Math.abs(movement.amount);
                accumulator.expenseCount++;
            }
            
            if (movement.amount > accumulator.largestIncome) {
                accumulator.largestIncome = movement.amount;
            }
            
            if (movement.amount < 0 && Math.abs(movement.amount) > accumulator.largestExpense) {
                accumulator.largestExpense = Math.abs(movement.amount);
            }
            
            return accumulator;
        }, {
            totalIncome: 0,
            totalExpenses: 0,
            incomeCount: 0,
            expenseCount: 0,
            largestIncome: 0,
            largestExpense: 0
        });

        const averageIncome = stats.incomeCount > 0 
            ? stats.totalIncome / stats.incomeCount 
            : 0;
        const averageExpense = stats.expenseCount > 0 
            ? stats.totalExpenses / stats.expenseCount 
            : 0;

        const currentBalance = movimientos.length > 0 
            ? movimientos[movimientos.length - 1].balance 
            : 0;

        const statsMessage = `
📊 ACCOUNT STATISTICS - ${activeAccountId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Current Balance: ${formatAmount(currentBalance)} €

📈 INCOME:
   • Total: ${formatAmount(stats.totalIncome)} €
   • Count: ${stats.incomeCount}
   • Average: ${formatAmount(averageIncome)} €
   • Largest income: ${formatAmount(stats.largestIncome)} €

📉 EXPENSES:
   • Total: ${formatAmount(stats.totalExpenses)} €
   • Count: ${stats.expenseCount}
   • Average: ${formatAmount(averageExpense)} €
   • Largest expense: ${formatAmount(stats.largestExpense)} €

📊 SUMMARY:
   • Total movements: ${movimientos.length}
   • Net difference: ${formatAmount(stats.totalIncome - stats.totalExpenses)} €
        `.trim();

        alert(statsMessage);

    } catch (error) {
        alert("Error calculating statistics: " + error.message);
    }
}