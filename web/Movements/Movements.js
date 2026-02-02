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
            const li = document.createElement('li');
            const amount = parseFloat(m.amount);
            li.className = amount >= 0 ? "income" : "expense";

            let formattedTimestamp = m.timestamp
                ? new Date(m.timestamp).toLocaleString()
                : '';

            li.innerHTML = `
                <span>${m.id}</span>
                <span>${m.amount}</span>
                <span>${m.balance}</span>
                <span>${formattedTimestamp}</span>
                <span>${m.description}</span>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        lista.innerHTML = `<li>Error: ${error.message}</li>`;
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


        // 3️⃣ Calcular nuevo balance
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

        // 4️⃣ Crear objeto movimiento
        const movementData = {
            amount: operation === "Payment" ? -amount : amount,
            balance: totalBalance,
            description: operation,
            timestamp: new Date().toISOString()
        };

        // 5️⃣ Enviar a la BBDD
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

        // 6️⃣ Cerrar modal, limpiar y recargar desde backend
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
        // 1️⃣ Obtener todos los movimientos en JSON
        const response = await fetch(`${url}/account/${accountId}`, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error(`Error al obtener movimientos: ${response.status}`);

        const movimientos = await response.json();

        if (movimientos.length === 0) {
            alert("No hay movimientos para deshacer");
            return;
        }

        // 2️⃣ Tomar el último movimiento
        const lastMovement = movimientos[movimientos.length - 1];

        // 3️⃣ Llamar al backend para borrarlo
        const deleteResponse = await fetch(`${url}/${lastMovement.id}`, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });

        if (!deleteResponse.ok) throw new Error(`No se pudo deshacer el movimiento: ${deleteResponse.status}`);

        // 4️⃣ Recargar la lista
        await cargarMovimientos();
        alert("Último movimiento deshecho correctamente");

    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Integración con el botón
const btnUndoLast = document.querySelector("#list button:nth-of-type(2)");
btnUndoLast.addEventListener("click", undoLastMovement);






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


