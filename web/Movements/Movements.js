async function cargarMovimientos() {
    const url = "/CRUDBankServerSide/webresources/movement";
    const lista = document.getElementById('movementsList');
    

    try {
        const response = await fetch(`${url}/account/${accountId}`);

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const xmlText = await response.text();

        // Parsear XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");

        const movimientosXML = xml.getElementsByTagName("movement");

        // Agregar movimientos
        [...movimientosXML].forEach(m => {
            const get = tag => m.getElementsByTagName(tag)[0]?.textContent ?? '';
              // Formatear timestamp
    let rawTimestamp = get("timestamp");
    let formattedTimestamp = rawTimestamp ? new Date(rawTimestamp).toLocaleString() : '';
    
     const li = document.createElement('li');

            // Detectar si es ingreso o gasto
            const amount = parseFloat(get("amount"));
            li.className = amount >= 0 ? "income" : "expense";

            
            li.innerHTML = `
                <span>${get("id")}</span>
                <span>${get("amount")}</span>
                <span>${get("balance")}</span>
                <span>${formattedTimestamp}</span>
                <span>${get("description")}</span>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        lista.innerHTML = `<li>Error: ${error.message}</li>`;
    }
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
        const accountId = "2654785441";

        const amount = parseFloat(amountInput);

        if (isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be a valid number");
        }

        if (!operation) {
            throw new Error("Operation is required");
        }

        // 1️⃣ Obtener movimientos desde la BBDD
        const movements = await fetchMovements(accountId);

        // 2️⃣ Obtener balance previo REAL (desde backend)
        let previousBalance = 0;
        if (movements.length > 0) {
            previousBalance = parseFloat(movements[movements.length - 1].balance);
        }

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
        const response = await fetch(`${SERVICE_URL}/${accountId}`, {
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




const accountId = "2654785441";
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


