const url = "/CRUDBankServerSide/webresources/movement";
const accountId = "2654785441";

async function cargarMovimientos() {
    const lista = document.getElementById('movementsList');
    lista.innerHTML = "";
    let movimientos = [];

    try {
        const response = await fetch(`${url}/account/${accountId}`, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error(`Error en la petición: ${response.status}`);

        movimientos = await response.json();

        movimientos.forEach(m => {
            const tr = document.createElement("tr");
            
            let formattedTimestamp = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
            
            tr.innerHTML = `
              <td>${m.id}</td>
              <td>${m.amount.toFixed(2)}</td>
              <td>${m.balance.toFixed(2)}</td>
              <td>${formattedTimestamp}</td>
              <td>${m.description}</td>
            `;
            
            if (m.amount >= 0) {
                tr.classList.add("income");
            } else {
                tr.classList.add("expense");
    }
        document.getElementById("movementsList").appendChild(tr);


        });

    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        lista.innerHTML = `
        <tr>
            <td colspan="5">Error: ${error.message}</td>
        </tr>`;
    }

    // Último balance
    let lastBalance = 0;
    if (movimientos.length > 0) {
        const lastMovement = movimientos[movimientos.length - 1];
        lastBalance = parseFloat(
            lastMovement.balance !== undefined && lastMovement.balance !== null
                ? lastMovement.balance
                : 0
        );
    }

    // Mostrar saldo actual
    const balanceDiv = document.getElementById("currentBalance");
    balanceDiv.textContent = `Current Balance: ${lastBalance.toFixed(2)}`;

    return lastBalance;
}





function createMovementsHandler(){
     const movementModal = document.getElementById("movementModal");
    
    
    movementModal.style.display = "flex"; // mostrar modal
    const btnCancel =document.getElementById("btnCancel");
    const movementForm = document.getElementById("movementForm");
    btnCancel.addEventListener("click", function() {
    movementModal.style.display = "none"; // ocultar modal
        
    });
    
}



async function movementCreator(event) {
    event.preventDefault();

    try {
        const amountInput = document.getElementById("amount").value;
        const operation = document.getElementById("Operation").value;
        

        const amount = parseFloat(amountInput);

        if (isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be a valid number");
        }

        if (!operation) {
            throw new Error("Operation is required");
        }

       
       const previousBalance = await cargarMovimientos();


        // Calcular nuevo balance
        let totalBalance;

        if (operation === "Deposit") {
            totalBalance = previousBalance + amount;
        } else if (operation === "Payment") {
            if (amount > previousBalance) {
                throw new Error("Insufficient balance");
            }
            totalBalance = previousBalance - amount;
        } else {
            throw new Error("Invalid operation");
        }

        // Crear objeto movimiento
        const movementData = {
            amount: operation === "Payment" ? -amount : amount,
            balance: totalBalance,
            description: operation,
            timestamp: new Date().toISOString()
        };

        // Enviar a la BBDD
        const response = await fetch(`${url}/${accountId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(movementData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error creating movement");
        }

        // Cerrar modal, limpiar y recargar desde backend
        document.getElementById("movementForm").reset();
        document.getElementById("movementModal").style.display = "none";

        await cargarMovimientos();

        alert("Movement created successfully");

    } catch (error) {
        alert("Error: " + error.message);
    }
}


async function undoLastMovement() {
    try {
        //  Obtener todos los movimientos en JSON
        const response = await fetch(`${url}/account/${accountId}`, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error(`Error al obtener movimientos: ${response.status}`);

        const movimientos = await response.json();

        if (movimientos.length === 0) {
            alert("No hay movimientos para deshacer");
            return;
        }

        // Tomar el último movimiento
        const lastMovement = movimientos[movimientos.length - 1];

        //  Llamar al backend para borrarlo
        const deleteResponse = await fetch(`${url}/${lastMovement.id}`, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });

        if (!deleteResponse.ok) throw new Error(`No se pudo deshacer el movimiento: ${deleteResponse.status}`);

        // Recargar la lista
        await cargarMovimientos();
        alert("Último movimiento deshecho correctamente");

    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Integración con el botón
document.getElementById("btnUndoMovement").addEventListener("click", undoLastMovement);







document.getElementById("movementForm").reset(); // limpiar formulario
cargarMovimientos();
// Selecciona el botón
const btnCreateMovement = document.getElementById("btnCreateMovement");
const movementsList = document.getElementById("movementsList");

// Asigna la función que se ejecutará al hacer clic
btnCreateMovement.addEventListener("click", function() {
  
    createMovementsHandler();
});
const movementForm = document.getElementById("movementForm");
movementForm.addEventListener("submit", movementCreator);


